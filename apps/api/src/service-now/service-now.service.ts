import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceNowClient } from './service-now.client';
import { ServiceNowFieldMapping } from './service-now.types';

@Injectable()
export class ServiceNowService {
  private db: any;
  private client: ServiceNowClient;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
    this.client = new ServiceNowClient();
  }

  async getConfig(tenantId: string) {
    const config = await this.db.serviceNowConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (config) {
      delete config.password;
      delete config.client_secret;
    }

    return config;
  }

  async saveConfig(tenantId: string, dto: any) {
    const existing = await this.db.serviceNowConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (existing) {
      return this.db.serviceNowConfig.update({
        where: { tenant_id: tenantId },
        data: {
          instance_url: dto.instance_url,
          username: dto.username,
          password: dto.password,
          client_id: dto.client_id,
          client_secret: dto.client_secret,
          field_mapping: dto.field_mapping || {},
          sync_direction: dto.sync_direction || 'inbound',
          conflict_resolution: dto.conflict_resolution || 'source_wins',
          schedule: dto.schedule,
        },
      });
    }

    return this.db.serviceNowConfig.create({
      data: {
        tenant_id: tenantId,
        instance_url: dto.instance_url,
        username: dto.username,
        password: dto.password,
        client_id: dto.client_id,
        client_secret: dto.client_secret,
        field_mapping: dto.field_mapping || {},
        sync_direction: dto.sync_direction || 'inbound',
        conflict_resolution: dto.conflict_resolution || 'source_wins',
        schedule: dto.schedule,
        is_active: true,
      },
    });
  }

  async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
    const config = await this.db.serviceNowConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!config) {
      return { success: false, message: 'No configuration found' };
    }

    this.client.configure({
      instanceUrl: config.instance_url,
      username: config.username,
      password: config.password,
      clientId: config.client_id || undefined,
      clientSecret: config.client_secret || undefined,
    });

    return this.client.testConnection();
  }

  async triggerSync(tenantId: string) {
    const config = await this.db.serviceNowConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException('ServiceNow not configured');
    }

    this.client.configure({
      instanceUrl: config.instance_url,
      username: config.username,
      password: config.password,
      clientId: config.client_id || undefined,
      clientSecret: config.client_secret || undefined,
    });

    const logId = await this.createSyncLog(tenantId, config.id, 'manual');

    try {
      const result = await this.syncCMDB(tenantId, config, logId);
      
      await this.db.serviceNowConfig.update({
        where: { id: config.id },
        data: {
          last_sync_at: new Date(),
          last_sync_status: 'success',
        },
      });

      await this.updateSyncLog(logId, 'success', result);
      return result;
    } catch (error: any) {
      await this.db.serviceNowConfig.update({
        where: { id: config.id },
        data: {
          last_sync_at: new Date(),
          last_sync_status: 'failed',
        },
      });

      await this.updateSyncLog(logId, 'failed', { error: error.message });
      throw error;
    }
  }

  private async syncCMDB(tenantId: string, config: any, logId: string) {
    const fieldMapping = config.field_mapping as Record<string, ServiceNowFieldMapping>;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.client.query('cmdb_ci', {
          sysparm_limit: 100,
          sysparm_offset: offset,
        });

        for (const record of response.result) {
          try {
            const result = await this.processRecord(tenantId, record, config, fieldMapping);
            if (result.created) totalCreated++;
            else if (result.updated) totalUpdated++;
            else totalSkipped++;
          } catch (err: any) {
            errors.push(`Record ${record.sys_id}: ${err.message}`);
          }
        }

        offset += 100;
        hasMore = response.result.length === 100;
      } catch (err: any) {
        errors.push(`Query failed: ${err.message}`);
        hasMore = false;
      }
    }

    return {
      total: totalCreated + totalUpdated + totalSkipped,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors,
    };
  }

  private async processRecord(tenantId: string, record: any, config: any, fieldMapping: any) {
    const mappedData = this.applyFieldMapping(record, fieldMapping);

    const existing = await this.db.application.findFirst({
      where: {
        tenant_id: tenantId,
        source_id: record.sys_id,
      },
    });

    if (existing) {
      if (config.sync_direction === 'bidirectional') {
        await this.db.application.update({
          where: { id: existing.id },
          data: {
            name: mappedData.name || existing.name,
            description: mappedData.description || existing.description,
            category: mappedData.category || existing.category,
            updated_at: new Date(),
          },
        });
        return { updated: true };
      }
      return { skipped: true };
    }

    await this.db.application.create({
      data: {
        tenant_id: tenantId,
        name: mappedData.name || 'Unknown',
        description: mappedData.description,
        category: mappedData.category,
        source_system: 'service_now',
        source_id: record.sys_id,
        discovered_at: new Date(),
      },
    });

    return { created: true };
  }

  private applyFieldMapping(record: any, fieldMapping: any): any {
    const result: any = {};

    if (!fieldMapping) return result;

    for (const [targetField, mapping] of Object.entries(fieldMapping as Record<string, any>)) {
      const sourceValue = record[mapping.sourceField];
      
      if (sourceValue === undefined || sourceValue === null) {
        result[targetField] = mapping.defaultValue;
        continue;
      }

      let value: any = typeof sourceValue === 'object' ? sourceValue.display_value || sourceValue.value : sourceValue;

      if (mapping.transform === 'uppercase') value = String(value).toUpperCase();
      else if (mapping.transform === 'lowercase') value = String(value).toLowerCase();
      else if (mapping.transform === 'number') value = parseFloat(value) || 0;

      result[targetField] = value;
    }

    return result;
  }

  async getSyncLogs(tenantId: string, limit: number = 100) {
    const config = await this.db.serviceNowConfig.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!config) return [];

    return this.db.serviceNowSyncLog.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  private async createSyncLog(tenantId: string, configId: string, syncType: string) {
    const log = await this.db.serviceNowSyncLog.create({
      data: {
        tenant_id: tenantId,
        config_id: configId,
        sync_type: syncType,
        status: 'running',
        started_at: new Date(),
      },
    });
    return log.id;
  }

  private async updateSyncLog(logId: string, status: string, result: any) {
    await this.db.serviceNowSyncLog.update({
      where: { id: logId },
      data: {
        status,
        records_total: result.total || 0,
        records_created: result.created || 0,
        records_updated: result.updated || 0,
        records_skipped: result.skipped || 0,
        errors: result.errors || [],
        completed_at: new Date(),
      },
    });
  }
}