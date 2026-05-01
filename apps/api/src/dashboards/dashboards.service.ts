import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveMetrics() {
    const totalApps = await this.prisma.application.count({ where: { deleted_at: null } });
    const activeApps = await this.prisma.application.count({ 
      where: { deleted_at: null, lifecycle_state: 'Active' } 
    });
    const atRiskApps = await this.prisma.application.count({ 
      where: { deleted_at: null, risk_score: { gte: 70 } } 
    });

    const activePercentage = totalApps === 0 ? 0 : Math.round((activeApps / totalApps) * 100);

    const costResult = await this.prisma.applicationCost.aggregate({
      _sum: {
        amount: true,
      },
    });

    const tco = costResult._sum.amount ? Number(costResult._sum.amount) : 0;

    // EOL count (e.g., retirement state or specific EOL date field)
    const eolApps = await this.prisma.application.count({ 
      where: { deleted_at: null, lifecycle_state: 'Retirement' } 
    });

    // Mock trend data for the sparklines
    const generateTrend = (base: number) => {
      return Array.from({ length: 12 }).map((_, i) => Math.max(0, base + Math.floor(Math.random() * 20 - 10)));
    };

    return {
      total_apps: totalApps,
      total_apps_trend: generateTrend(totalApps),
      active_percentage: activePercentage,
      active_trend: generateTrend(activePercentage),
      at_risk_count: atRiskApps,
      at_risk_trend: generateTrend(atRiskApps),
      tco: tco,
      tco_trend: generateTrend(tco > 100 ? tco / 100 : tco), // scaled trend
      eol_count: eolApps,
      eol_trend: generateTrend(eolApps),
    };
  }

  async getFinancialMetrics() {
    // Top 10 Expensive Apps (Derived from cost table)
    const appsWithCosts = await this.prisma.application.findMany({
      where: { deleted_at: null },
      include: {
        costs: true,
        business_unit: true,
      },
    });

    const appCostMap = appsWithCosts.map(app => {
      const totalCost = app.costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
      return {
        id: app.id,
        name: app.name,
        business_unit: app.business_unit?.name || 'Unassigned',
        total_cost: totalCost,
      };
    });

    // Sort by cost descending and take top 10
    const topExpensiveApps = appCostMap
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 10);

    // Cost by BU
    const costByBuMap = new Map<string, number>();
    appCostMap.forEach(app => {
      const current = costByBuMap.get(app.business_unit) || 0;
      costByBuMap.set(app.business_unit, current + app.total_cost);
    });
    const costByBu = Array.from(costByBuMap.entries()).map(([name, value]) => ({ name, value }));

    // Cost by Type
    const costs = await this.prisma.applicationCost.findMany();
    const costByTypeMap = new Map<string, number>();
    costs.forEach(cost => {
      const type = cost.cost_type;
      const amount = Number(cost.amount);
      const current = costByTypeMap.get(type) || 0;
      costByTypeMap.set(type, current + amount);
    });
    const costByType = Array.from(costByTypeMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      top_expensive_apps: topExpensiveApps,
      cost_by_bu: costByBu,
      cost_by_type: costByType,
    };
  }

  async getRiskMetrics() {
    const apps = await this.prisma.application.findMany({
      where: { deleted_at: null },
      select: {
        lifecycle_state: true,
        risk_score: true,
        technology_type: true,
      }
    });

    // Lifecycle distribution
    const lifecycleMap = new Map<string, number>();
    apps.forEach(app => {
      const state = app.lifecycle_state || 'Unknown';
      lifecycleMap.set(state, (lifecycleMap.get(state) || 0) + 1);
    });
    const lifecycleDistribution = Array.from(lifecycleMap.entries()).map(([name, value]) => ({ name, value }));

    // Risk distribution (Low: <40, Medium: 40-70, High: >70)
    let low = 0, medium = 0, high = 0;
    apps.forEach(app => {
      if (app.risk_score < 40) low++;
      else if (app.risk_score < 70) medium++;
      else high++;
    });

    return {
      lifecycle_distribution: lifecycleDistribution,
      risk_distribution: [
        { name: 'Low Risk', value: low },
        { name: 'Medium Risk', value: medium },
        { name: 'High Risk', value: high },
      ]
    };
  }
}
