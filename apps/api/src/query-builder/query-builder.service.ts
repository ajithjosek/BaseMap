import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);
  private db: any;
  private queryCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 30000;
  private readonly MAX_CACHE_SIZE = 100;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
    setInterval(() => this.cleanCache(), 60000);
  }

  private getCacheKey(tenantId: string, config: any): string {
    const key = JSON.stringify({ tenantId, ...config });
    return Buffer.from(key).toString('base64').slice(0, 64);
  }

  private getCachedResult(key: string): any | null {
    const entry = this.queryCache.get(key);
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.data;
    }
    this.queryCache.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
    this.queryCache.set(key, { data, timestamp: Date.now() });
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.queryCache.delete(key);
      }
    }
  }

  async executeQuery(tenantId: string, userId: string, config: {
    entity: string;
    columns: string[];
    filters: Record<string, any>[];
    joins?: string[];
    groupBy?: string[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(tenantId, config);
    const cachedResult = this.getCachedResult(cacheKey);
    
    if (cachedResult) {
      this.logger.debug(`Cache hit for query (${Date.now() - startTime}ms)`);
      await this.saveQueryHistory(tenantId, userId, config, cachedResult.total, true);
      return { ...cachedResult, fromCache: true };
    }

    const entityConfig = this.getEntityConfig(config.entity);
    if (!entityConfig) {
      throw new NotFoundException(`Entity ${config.entity} not found`);
    }

    const allowedColumns = entityConfig.columns.filter(c => config.columns.includes(c));
    if (allowedColumns.length === 0) {
      throw new NotFoundException('No valid columns selected');
    }

    const where: any = { tenant_id: tenantId };
    if (config.filters?.length) {
      for (const filter of config.filters) {
        if (filter.field && filter.value !== undefined && filter.value !== '') {
          if (filter.operator === 'contains') {
            where[filter.field] = { contains: filter.value, mode: 'insensitive' };
          } else if (filter.operator === 'eq') {
            where[filter.field] = filter.value;
          } else if (filter.operator === 'gt') {
            where[filter.field] = { gt: Number(filter.value) };
          } else if (filter.operator === 'lt') {
            where[filter.field] = { lt: Number(filter.value) };
          } else if (filter.operator === 'in') {
            where[filter.field] = { in: filter.value.split(',') };
          } else if (filter.operator === 'isNull') {
            where[filter.field] = null;
          } else if (filter.operator === 'isNotNull') {
            where[filter.field] = { not: null };
          }
        }
      }
    }

    const select: any = {};
    allowedColumns.forEach(col => { select[col] = true; });

    let results: any[];
    let total = 0;

    if (config.groupBy?.length) {
      const groupBySelect: any = {};
      config.groupBy.forEach(g => { groupBySelect[g] = true; });
      const groupByArr = config.groupBy as string[];
      allowedColumns.forEach(col => { if (!groupByArr.includes(col)) groupBySelect[col] = true; });
      
      results = await this.db[entityConfig.model].groupBy({
        by: config.groupBy,
        where,
        ...groupBySelect,
        _count: true,
        orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'asc' } : undefined,
        take: config.limit || 50,
        skip: config.offset || 0,
      });
      total = results.length;
    } else {
      const [data, count] = await Promise.all([
        this.db[entityConfig.model].findMany({
          where,
          select,
          orderBy: config.sortBy ? { [config.sortBy]: config.sortOrder || 'asc' } : { created_at: 'desc' },
          take: config.limit || 50,
          skip: config.offset || 0,
        }),
        this.db[entityConfig.model].count({ where }),
      ]);
      results = data;
      total = count;
    }

    await this.saveQueryHistory(tenantId, userId, config, results.length, false);

    const response = {
      data: results,
      total,
      page: Math.floor((config.offset || 0) / (config.limit || 50)) + 1,
      pageSize: config.limit || 50,
    };

    this.setCachedResult(cacheKey, response);
    const duration = Date.now() - startTime;
    this.logger.log(`Query executed in ${duration}ms${config.filters?.length ? ` with ${config.filters.length} filters` : ''}`);

    return response;
  }

  async saveInsight(tenantId: string, userId: string, data: {
    name: string;
    description?: string;
    entity_type: string;
    query_config: any;
    chart_type?: string;
    is_shared?: boolean;
  }) {
    const shareToken = data.is_shared ? this.generateShareToken() : null;
    
    return this.db.insight.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        name: data.name,
        description: data.description,
        entity_type: data.entity_type,
        query_config: data.query_config,
        chart_type: data.chart_type,
        is_shared: data.is_shared || false,
        share_token: shareToken,
      },
    });
  }

  async getInsights(tenantId: string, userId: string) {
    return this.db.insight.findMany({
      where: {
        OR: [
          { tenant_id: tenantId, user_id: userId },
          { tenant_id: tenantId, is_shared: true },
        ],
      },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getInsightByShareToken(token: string) {
    const insight = await this.db.insight.findFirst({
      where: { share_token: token, is_shared: true },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
      },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found or not shared');
    }

    return insight;
  }

  async deleteInsight(id: string, tenantId: string, userId: string) {
    const insight = await this.db.insight.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    return this.db.insight.delete({ where: { id } });
  }

  async getQueryHistory(tenantId: string, userId: string, limit: number = 20) {
    return this.db.queryHistory.findMany({
      where: { tenant_id: tenantId, user_id: userId },
      orderBy: { executed_at: 'desc' },
      take: limit,
    });
  }

  getEntityConfig(entity: string) {
    const entities: Record<string, { model: string; columns: string[]; label: string }> = {
      applications: {
        model: 'application',
        columns: ['id', 'name', 'description', 'vendor', 'version', 'technology_type', 'lifecycle_state', 'risk_score', 'eol_date', 'deployment_model', 'cloud_readiness_score', 'created_at'],
        label: 'Applications',
      },
      capabilities: {
        model: 'capabilityNode',
        columns: ['id', 'name', 'description', 'category', 'maturity_level', 'criticality', 'created_at'],
        label: 'Capabilities',
      },
      costs: {
        model: 'applicationCost',
        columns: ['id', 'application_id', 'cost_type', 'amount', 'frequency', 'start_date', 'end_date'],
        label: 'Costs',
      },
      interfaces: {
        model: 'interface',
        columns: ['id', 'name', 'source', 'target', 'protocol', 'status', 'created_at'],
        label: 'API Interfaces',
      },
      components: {
        model: 'technologyComponent',
        columns: ['id', 'name', 'component_type', 'environment', 'status', 'host', 'cloud_region', 'eol_date'],
        label: 'Components',
      },
      saas: {
        model: 'saaSApplication',
        columns: ['id', 'vendor', 'use_case', 'annual_contract_value', 'pricing_model', 'contract_end_date', 'total_seats', 'is_shadow_it'],
        label: 'SaaS Applications',
      },
    };
    return entities[entity];
  }

  getEntities() {
    return Object.entries(this.getEntityConfig('')).map(([key, val]: [string, any]) => ({
      value: key,
      label: val.label,
      columns: val.columns,
    }));
  }

  private async saveQueryHistory(tenantId: string, userId: string, config: any, resultCount: number, fromCache: boolean = false) {
    await this.db.queryHistory.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        entity_type: config.entity,
        query_config: { ...config, from_cache: fromCache },
        result_count: resultCount,
      },
    });
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }
}