import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvancedAnalyticsService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async getWidgets(userId: string, tenantId: string, shared?: boolean) {
    const where: any = { tenant_id: tenantId };
    if (!shared) {
      where.user_id = userId;
    } else {
      where.is_shared = true;
    }
    return this.db.dashboardWidget.findMany({
      where,
      orderBy: [{ position_y: 'asc' }, { position_x: 'asc' }],
    });
  }

  async createWidget(userId: string, tenantId: string, data: any) {
    return this.db.dashboardWidget.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        name: data.name,
        widget_type: data.widget_type,
        config: data.config || {},
        position_x: data.position_x || 0,
        position_y: data.position_y || 0,
        width: data.width || 4,
        height: data.height || 3,
        is_shared: data.is_shared || false,
      },
    });
  }

  async updateWidget(id: string, userId: string, tenantId: string, data: any) {
    const widget = await this.db.dashboardWidget.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!widget) throw new NotFoundException('Widget not found');

    return this.db.dashboardWidget.update({
      where: { id },
      data: {
        name: data.name,
        config: data.config,
        position_x: data.position_x,
        position_y: data.position_y,
        width: data.width,
        height: data.height,
        is_shared: data.is_shared,
      },
    });
  }

  async deleteWidget(id: string, userId: string, tenantId: string) {
    const widget = await this.db.dashboardWidget.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!widget) throw new NotFoundException('Widget not found');
    return this.db.dashboardWidget.delete({ where: { id } });
  }

  async getBudgetForecast(tenantId: string, fiscalYear?: number) {
    const where: any = { tenant_id: tenantId };
    if (fiscalYear) where.fiscal_year = fiscalYear;

    return this.db.budgetForecast.findMany({
      where,
      orderBy: [{ fiscal_year: 'asc' }, { fiscal_month: 'asc' }],
    });
  }

  async createBudgetForecast(tenantId: string, data: any) {
    return this.db.budgetForecast.create({
      data: {
        tenant_id: tenantId,
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        category: data.category,
        predicted: data.predicted,
        actual: data.actual,
        variance: data.variance,
        notes: data.notes,
      },
    });
  }

  async getAnalyticsSummary(tenantId: string) {
    const saas = await this.db.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: { annual_contract_value: true, use_case: true },
    });

    const tech = await this.db.technologyComponent.findMany({
      where: { tenant_id: tenantId },
      select: { component_type: true, status: true },
    });

    const applications = await this.db.application.findMany({
      where: { tenant_id: tenantId },
      select: { lifecycle_state: true },
    });

    const saasByCategory: Record<string, number> = {};
    let totalSaaSSpend = 0;
    for (const s of saas) {
      const cat = s.use_case || 'Other';
      saasByCategory[cat] = (saasByCategory[cat] || 0) + Number(s.annual_contract_value || 0);
      totalSaaSSpend += Number(s.annual_contract_value || 0);
    }

    const techByType: Record<string, number> = {};
    const techByStatus: Record<string, number> = {};
    for (const t of tech) {
      techByType[t.component_type] = (techByType[t.component_type] || 0) + 1;
      techByStatus[t.status] = (techByStatus[t.status] || 0) + 1;
    }

    const appsByState: Record<string, number> = {};
    for (const a of applications) {
      appsByState[a.lifecycle_state] = (appsByState[a.lifecycle_state] || 0) + 1;
    }

    return {
      saas_spend: { total: totalSaaSSpend, by_category: saasByCategory },
      technology: { total: tech.length, by_type: techByType, by_status: techByStatus },
      applications: { total: applications.length, by_state: appsByState },
    };
  }

  async getCostTrend(tenantId: string, months: number = 12) {
    const saasApps = await this.db.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: { vendor: true, annual_contract_value: true, contract_start_date: true },
    });

    const costs = await this.db.applicationCost.findMany({
      where: { tenant_id: tenantId },
      select: { amount: true, cost_date: true, cost_type: true },
      orderBy: { cost_date: 'asc' },
    });

    const monthlyCosts: Record<string, number> = {};
    for (const c of costs) {
      const monthKey = c.cost_date?.toISOString().slice(0, 7) || 'unknown';
      monthlyCosts[monthKey] = (monthlyCosts[monthKey] || 0) + Number(c.amount || 0);
    }

    const trend = Object.entries(monthlyCosts)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-months);

    return trend;
  }
}