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

  async processEOLAlerts() {
    this.logger.log('Processing EOL alerts...');
    
    const alerts = [
      { days: 365, type: 'eol_12m' },
      { days: 180, type: 'eol_6m' },
      { days: 90, type: 'eol_3m' },
      { days: 30, type: 'eol_1m' },
    ];

    for (const alert of alerts) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + alert.days);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const apps = await this.db.application.findMany({
        where: {
          eol_date: { not: null, gte: startOfDay, lte: endOfDay },
        },
        select: { id: true, name: true, eol_date: true, tenant_id: true },
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
          const users = await this.db.user.findMany({
            where: { tenant_id: app.tenant_id, is_active: true },
            take: 1,
          });

          if (users.length > 0) {
            await this.db.notification.create({
              data: {
                tenant_id: app.tenant_id,
                user_id: users[0].id,
                type: 'eol_alert',
                title: `EOL Alert: ${app.name}`,
                message: `${app.name} reaches end-of-life on ${new Date(app.eol_date).toLocaleDateString()}. ${Math.floor(alert.days / 30)} month(s) remaining.`,
                related_entity_type: 'application',
                related_entity_id: app.id,
              },
            });
            
            this.logger.log(`Created EOL alert for ${app.name} (${alert.days} days)`);
          }
        }
      }

      const components = await this.db.technologyComponent.findMany({
        where: {
          eol_date: { not: null, gte: startOfDay, lte: endOfDay },
        },
        select: { id: true, name: true, eol_date: true, tenant_id: true },
      });

      for (const comp of components) {
        const existingNotification = await this.db.notification.findFirst({
          where: {
            tenant_id: comp.tenant_id,
            related_entity_id: comp.id,
            type: alert.type + '_component',
          },
        });

        if (!existingNotification) {
          const users = await this.db.user.findMany({
            where: { tenant_id: comp.tenant_id, is_active: true },
            take: 1,
          });

          if (users.length > 0) {
            await this.db.notification.create({
              data: {
                tenant_id: comp.tenant_id,
                user_id: users[0].id,
                type: 'eol_alert_component',
                title: `Component EOL Alert: ${comp.name}`,
                message: `${comp.name} reaches end-of-life on ${new Date(comp.eol_date).toLocaleDateString()}. ${Math.floor(alert.days / 30)} month(s) remaining.`,
                related_entity_type: 'technology_component',
                related_entity_id: comp.id,
              },
            });
            
            this.logger.log(`Created EOL alert for component ${comp.name}`);
          }
        }
      }
    }
  }

  async processEOLRiskScoreCalculation() {
    this.logger.log('Calculating EOL risk scores...');
    
    const tenants = await this.db.tenant.findMany({ select: { id: true } });
    
    for (const tenant of tenants) {
      await this.calculateEOLRiskScores(tenant.id);
    }
  }

  private async calculateEOLRiskScores(tenantId: string) {
    const apps = await this.db.application.findMany({
      where: { tenant_id: tenantId, eol_date: { not: null } },
      select: { id: true, eol_date: true },
    });

    const components = await this.db.technologyComponent.findMany({
      where: { tenant_id: tenantId, eol_date: { not: null } },
      select: { id: true, eol_date: true },
    });

    const now = new Date();

    for (const app of apps) {
      const daysRemaining = Math.ceil((new Date(app.eol_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let riskScore = 0;
      if (daysRemaining < 0) riskScore = 100;
      else if (daysRemaining <= 30) riskScore = 80 + Math.round((30 - daysRemaining) * 0.5);
      else if (daysRemaining <= 90) riskScore = 60 + Math.round((90 - daysRemaining) * 0.3);
      else if (daysRemaining <= 180) riskScore = 40 + Math.round((180 - daysRemaining) * 0.2);
      else riskScore = Math.max(0, 20 - Math.round((daysRemaining - 180) * 0.1));

      await this.db.application.update({
        where: { id: app.id },
        data: { risk_score: riskScore },
      });
    }

    for (const comp of components) {
      const daysRemaining = Math.ceil((new Date(comp.eol_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let riskScore = 0;
      if (daysRemaining < 0) riskScore = 100;
      else if (daysRemaining <= 30) riskScore = 80 + Math.round((30 - daysRemaining) * 0.5);
      else if (daysRemaining <= 90) riskScore = 60 + Math.round((90 - daysRemaining) * 0.3);
      else if (daysRemaining <= 180) riskScore = 40 + Math.round((180 - daysRemaining) * 0.2);
      else riskScore = Math.max(0, 20 - Math.round((daysRemaining - 180) * 0.1));

      const existing = await this.db.technologyComponent.findUnique({ where: { id: comp.id } });
      const currentAttrs = existing?.custom_attributes || {};
      
      await this.db.technologyComponent.update({
        where: { id: comp.id },
        data: { custom_attributes: { ...currentAttrs, risk_score: riskScore } },
      });
    }

    this.logger.log(`Updated EOL risk scores for tenant ${tenantId}`);
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