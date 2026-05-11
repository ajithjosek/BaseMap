import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EOLRiskService {
  private readonly logger = new Logger(EOLRiskService.name);
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  async getEOLDashboard(tenantId: string) {
    const apps = await this.db.application.findMany({
      where: { tenant_id: tenantId, eol_date: { not: null } },
      select: { id: true, name: true, eol_date: true, risk_score: true, deployment_model: true },
    });

    const components = await this.db.technologyComponent.findMany({
      where: { tenant_id: tenantId, eol_date: { not: null } },
      select: { id: true, name: true, eol_date: true, component_type: true },
    });

    const now = new Date();

    const categorize = (eolDate: Date) => {
      const daysRemaining = Math.ceil((new Date(eolDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) return 'expired';
      if (daysRemaining <= 30) return 'critical';
      if (daysRemaining <= 90) return 'high';
      if (daysRemaining <= 180) return 'medium';
      return 'low';
    };

    const appCounts = { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };
    const compCounts = { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };

    const appRisks = apps.map(app => {
      const category = categorize(app.eol_date);
      appCounts[category as keyof typeof appCounts]++;
      return { ...app, daysRemaining: Math.ceil((new Date(app.eol_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) };
    });

    const compRisks = components.map(c => {
      const category = categorize(c.eol_date);
      compCounts[category as keyof typeof compCounts]++;
      return { ...c, daysRemaining: Math.ceil((new Date(c.eol_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) };
    });

    return {
      applications: { counts: appCounts, items: appRisks },
      components: { counts: compCounts, items: compRisks },
      total_apps_at_risk: appCounts.critical + appCounts.high,
      total_components_at_risk: compCounts.critical + compCounts.high,
    };
  }

  async calculateAndUpdateRiskScores(tenantId: string) {
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

      await this.db.technologyComponent.update({
        where: { id: comp.id },
        data: { custom_attributes: { ...{}, risk_score: riskScore } },
      });
    }

    this.logger.log(`Updated EOL risk scores for ${apps.length} apps and ${components.length} components`);
  }
}