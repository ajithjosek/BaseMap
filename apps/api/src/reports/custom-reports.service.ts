import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomReportDto, UpdateCustomReportDto, ExecuteReportDto } from './dto/custom-report.dto';

@Injectable()
export class CustomReportsService {
  constructor(private prisma: PrismaService) {}

  private get db() {
    return this.prisma as any;
  }

  async create(tenantId: string, userId: string, dto: CreateCustomReportDto) {
    return this.db.customReport.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        name: dto.name,
        description: dto.description,
        entity_type: dto.entity_type,
        columns: dto.columns,
        filters: dto.filters,
        group_by: dto.group_by || [],
        aggregations: dto.aggregations || [],
        is_shared: dto.is_shared || false,
        is_public: dto.is_public || false,
        schedule: dto.schedule,
        schedule_time: dto.schedule_time,
      },
    });
  }

  async findAll(tenantId: string, userId: string) {
    const reports = await this.db.customReport.findMany({
      where: {
        tenant_id: tenantId,
        OR: [
          { user_id: userId },
          { is_shared: true },
          { is_public: true },
        ],
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
      orderBy: { updated_at: 'desc' },
    });
    return reports;
  }

  async findOne(id: string, tenantId: string) {
    const report = await this.db.customReport.findUnique({
      where: { id, tenant_id: tenantId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException('Custom report not found');
    return report;
  }

  async update(id: string, tenantId: string, userId: string, dto: UpdateCustomReportDto) {
    const existing = await this.db.customReport.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Custom report not found');
    if (existing.user_id !== userId) throw new NotFoundException('Not authorized to update this report');

    return this.db.customReport.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    const existing = await this.db.customReport.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Custom report not found');
    if (existing.user_id !== userId) throw new NotFoundException('Not authorized to delete this report');

    await this.db.customReport.delete({ where: { id } });
    return { success: true };
  }

  async executeReport(id: string, tenantId: string, dto?: ExecuteReportDto) {
    const report = await this.findOne(id, tenantId);
    
    const filters = dto?.filters || report.filters as any[] || [];
    const groupBy = dto?.group_by || report.group_by as string[] || [];
    const aggregations = dto?.aggregations || report.aggregations as any[] || [];
    const columns = report.columns as string[] || [];

    let queryResult: any[] = [];
    
    switch (report.entity_type) {
      case 'application':
        queryResult = await this.executeApplicationQuery(tenantId, filters, groupBy, aggregations, columns);
        break;
      case 'capability':
        queryResult = await this.executeCapabilityQuery(tenantId, filters, groupBy, aggregations, columns);
        break;
      case 'cost':
        queryResult = await this.executeCostQuery(tenantId, filters, groupBy, aggregations, columns);
        break;
      default:
        queryResult = await this.executeApplicationQuery(tenantId, filters, groupBy, aggregations, columns);
    }

    await this.db.customReport.update({
      where: { id },
      data: { last_run_at: new Date() },
    });

    return {
      report_id: id,
      report_name: report.name,
      executed_at: new Date().toISOString(),
      row_count: queryResult.length,
      data: queryResult,
    };
  }

  private async executeApplicationQuery(
    tenantId: string,
    filters: any[],
    groupBy: string[],
    aggregations: any[],
    columns: string[]
  ) {
    const where: any = { tenant_id: tenantId };

    for (const filter of filters) {
      if (filter.field && filter.operator && filter.value) {
        const field = filter.field;
        const operator = filter.operator;
        const value = filter.value;

        if (operator === 'eq') where[field] = value;
        else if (operator === 'ne') where[field] = { not: value };
        else if (operator === 'gt') where[field] = { gt: Number(value) };
        else if (operator === 'lt') where[field] = { lt: Number(value) };
        else if (operator === 'contains') where[field] = { contains: value };
        else if (operator === 'in') where[field] = { in: value.split(',') };
      }
    }

    const apps = await this.prisma.application.findMany({
      where,
      include: {
        business_unit: true,
        owner: { select: { first_name: true, last_name: true, email: true } },
        costs: true,
      },
      orderBy: { name: 'asc' },
    });

    if (groupBy.length === 0) {
      return apps.map(app => this.mapColumns(app, columns));
    }

    const grouped: Record<string, any[]> = {};
    for (const app of apps) {
      const key = groupBy.map(g => {
        if (g === 'business_unit') return app.business_unit?.name || 'Unassigned';
        if (g === 'lifecycle') return app.lifecycle_state;
        if (g === 'owner') return app.owner ? `${app.owner.first_name} ${app.owner.last_name}` : 'Unassigned';
        return app[g as keyof typeof app] || 'Unknown';
      }).join('::');
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(app);
    }

    const result = Object.entries(grouped).map(([key, items]) => {
      const row: any = {};
      const keyParts = key.split('::');
      groupBy.forEach((g, i) => row[g] = keyParts[i]);

      for (const agg of aggregations) {
        if (agg.type === 'count') row[agg.alias || 'count'] = items.length;
        if (agg.type === 'sum' && agg.field === 'cost') {
          const total = items.reduce((sum, app) => 
            sum + app.costs.reduce((s, c) => s + Number(c.amount), 0), 0);
          row[agg.alias || 'total_cost'] = total;
        }
        if (agg.type === 'avg' && agg.field === 'risk') {
          const avgRisk = items.reduce((sum, app) => sum + app.risk_score, 0) / items.length;
          row[agg.alias || 'avg_risk'] = Math.round(avgRisk);
        }
      }

      return row;
    });

    return result;
  }

  private async executeCapabilityQuery(
    tenantId: string,
    filters: any[],
    groupBy: string[],
    aggregations: any[],
    columns: string[]
  ) {
    const where: any = { tenant_id: tenantId };
    
    const capabilities = await this.prisma.capabilityNode.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
        children: true,
      },
    });

    return capabilities.map(cap => this.mapColumns(cap, columns));
  }

  private async executeCostQuery(
    tenantId: string,
    filters: any[],
    groupBy: string[],
    aggregations: any[],
    columns: string[]
  ) {
    const where: any = { tenant_id: tenantId };
    
    const costs = await this.prisma.applicationCost.findMany({
      where: { application: where },
      include: {
        application: { select: { name: true, business_unit_id: true } },
      },
    });

    return costs.map(cost => this.mapColumns(cost, columns));
  }

  private mapColumns(item: any, columns: string[]) {
    if (!columns || columns.length === 0) return item;
    
    const result: any = {};
    for (const col of columns) {
      result[col] = item[col];
    }
    return result;
  }

  async exportToCsv(id: string, tenantId: string) {
    const result = await this.executeReport(id, tenantId);
    
    if (!result.data || result.data.length === 0) {
      return 'No data to export';
    }

    const headers = Object.keys(result.data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of result.data) {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  async shareReport(id: string, tenantId: string, userId: string, isShared: boolean) {
    const existing = await this.db.customReport.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Custom report not found');
    if (existing.user_id !== userId) throw new NotFoundException('Not authorized');

    return this.db.customReport.update({
      where: { id },
      data: { is_shared: isShared },
    });
  }
}