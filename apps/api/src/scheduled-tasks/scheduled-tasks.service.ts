import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceNowService } from '../service-now/service-now.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);
  private db: any;

  constructor(private prisma: PrismaService, private serviceNowService: ServiceNowService) {
    this.db = this.prisma as any;
  }

  async processRenewalAlerts() {
    this.logger.log('Processing renewal alerts...');
    
    const now = new Date();
    const alerts = [
      { days: 90, type: 'renewal_90' },
      { days: 60, type: 'renewal_60' },
      { days: 30, type: 'renewal_30' },
    ];

    for (const alert of alerts) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + alert.days);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const apps = await this.db.saaSApplication.findMany({
        where: {
          contract_end_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          auto_renewal: false,
        },
        select: {
          id: true,
          vendor: true,
          contract_end_date: true,
          annual_contract_value: true,
          tenant_id: true,
        },
      });

      for (const app of apps) {
        const existingNotification = await this.db.notification.findFirst({
          where: {
            tenant_id: app.tenant_id,
            related_entity_id: app.id,
            type: alert.type,
          },
        });

        if (!existingNotification) {
          await this.db.notification.create({
            data: {
              tenant_id: app.tenant_id,
              user_id: app.tenant_id,
              type: 'renewal_alert',
              title: `Contract Renewal in ${alert.days} Days`,
              message: `The ${app.vendor} contract ($${Number(app.annual_contract_value || 0).toLocaleString()}) expires on ${new Date(app.contract_end_date).toLocaleDateString()}. Action required.`,
              related_entity_type: 'saas_application',
              related_entity_id: app.id,
            },
          });
          
          this.logger.log(`Created ${alert.days}-day renewal alert for ${app.vendor}`);
        }
      }
    }
  }

  async processAnnualReviews() {
    this.logger.log('Processing annual reviews...');
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const apps = await this.db.saaSApplication.findMany({
      where: {
        approval_date: {
          lte: oneYearAgo,
        },
      },
      select: {
        id: true,
        vendor: true,
        approval_date: true,
        tenant_id: true,
      },
    });

    for (const app of apps) {
      const lastReviewNotification = await this.db.notification.findFirst({
        where: {
          tenant_id: app.tenant_id,
          related_entity_id: app.id,
          type: 'annual_review',
        },
        orderBy: { created_at: 'desc' },
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (!lastReviewNotification || new Date(lastReviewNotification.created_at) < sixMonthsAgo) {
        const users = await this.db.user.findMany({
          where: { tenant_id: app.tenant_id, is_active: true },
          take: 1,
        });

        if (users.length > 0) {
          await this.db.notification.create({
            data: {
              tenant_id: app.tenant_id,
              user_id: users[0].id,
              type: 'annual_review',
              title: 'Annual Review Required',
              message: `It's been over a year since ${app.vendor} was approved. Please review the application's usage and business value.`,
              related_entity_type: 'saas_application',
              related_entity_id: app.id,
            },
          });
          
          this.logger.log(`Created annual review reminder for ${app.vendor}`);
        }
      }
    }
  }

  async processServiceNowSync() {
    this.logger.log('Processing scheduled ServiceNow syncs...');
    
    const configs = await this.db.serviceNowConfig.findMany({
      where: {
        is_active: true,
        schedule: { not: null },
      },
    });

    for (const config of configs) {
      const lastSync = config.last_sync_at;
      const now = new Date();
      let shouldSync = false;

      switch (config.schedule) {
        case 'hourly':
          if (!lastSync || (now.getTime() - new Date(lastSync).getTime()) > 60 * 60 * 1000) {
            shouldSync = true;
          }
          break;
        case 'daily':
          if (!lastSync || new Date(lastSync).toDateString() !== now.toDateString()) {
            shouldSync = true;
          }
          break;
        case 'weekly':
          const lastWeek = new Date(now);
          lastWeek.setDate(lastWeek.getDate() - 7);
          if (!lastSync || new Date(lastSync) < lastWeek) {
            shouldSync = true;
          }
          break;
      }

      if (shouldSync) {
        try {
          this.logger.log(`Triggering scheduled sync for tenant ${config.tenant_id}`);
          await this.triggerSync(config);
        } catch (error: any) {
          this.logger.error(`Scheduled sync failed: ${error.message}`);
          await this.createSyncFailureAlert(config.tenant_id, error.message);
        }
      }
    }
  }

  private async triggerSync(config: any) {
    try {
      await this.serviceNowService.triggerSync(config.tenant_id);
      this.logger.log(`Scheduled sync completed for tenant ${config.tenant_id}`);
    } catch (error: any) {
      this.logger.error(`Scheduled sync failed: ${error.message}`);
      throw error;
    }
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
        records_total: (result.created || 0) + (result.updated || 0) + (result.skipped || 0),
        records_created: result.created || 0,
        records_updated: result.updated || 0,
        records_skipped: result.skipped || 0,
        errors: result.error ? [result.error] : [],
        completed_at: new Date(),
      },
    });
  }

  private async createSyncFailureAlert(tenantId: string, errorMessage: string) {
    const users = await this.db.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      take: 1,
    });

    if (users.length > 0) {
      await this.db.notification.create({
        data: {
          tenant_id: tenantId,
          user_id: users[0].id,
          type: 'sync_failure',
          title: 'ServiceNow Sync Failed',
          message: `The scheduled ServiceNow sync failed: ${errorMessage}. Please check the integration settings.`,
          related_entity_type: 'service_now',
        },
      });
    }
  }
}