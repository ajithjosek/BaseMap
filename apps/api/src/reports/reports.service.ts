import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReportFilters {
  businessUnitId?: string;
  lifecycleState?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private get db() {
    return this.prisma as any;
  }

  async generateApplicationLandscapeReport(tenantId: string, filters: ReportFilters) {
    const where: any = { tenant_id: tenantId };
    
    if (filters.businessUnitId) {
      where.business_unit_id = filters.businessUnitId;
    }
    if (filters.lifecycleState) {
      where.lifecycle_state = filters.lifecycleState;
    }
    if (filters.ownerId) {
      where.owner_id = filters.ownerId;
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        business_unit: true,
        owner: { select: { id: true, first_name: true, last_name: true, email: true } },
        costs: true,
        capabilities: {
          include: {
            capability: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const summary = {
      total: applications.length,
      byLifecycle: {} as Record<string, number>,
      byBusinessUnit: {} as Record<string, number>,
      byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 }
    };

    for (const app of applications) {
      summary.byLifecycle[app.lifecycle_state] = (summary.byLifecycle[app.lifecycle_state] || 0) + 1;
      
      const buName = app.business_unit?.name || 'Unassigned';
      summary.byBusinessUnit[buName] = (summary.byBusinessUnit[buName] || 0) + 1;

      if (app.risk_score <= 30) summary.byRiskLevel.low++;
      else if (app.risk_score <= 60) summary.byRiskLevel.medium++;
      else if (app.risk_score <= 80) summary.byRiskLevel.high++;
      else summary.byRiskLevel.critical++;
    }

    return {
      generated_at: new Date().toISOString(),
      filters,
      summary,
      applications: applications.map(app => ({
        id: app.id,
        name: app.name,
        vendor: app.vendor,
        lifecycle: app.lifecycle_state,
        risk_score: app.risk_score,
        business_unit: app.business_unit?.name,
        owner: app.owner ? `${app.owner.first_name} ${app.owner.last_name}` : 'Unassigned',
        total_cost: app.costs.reduce((sum, c) => sum + Number(c.amount), 0),
        capabilities_mapped: app.capabilities.length,
        eol_date: app.eol_date
      }))
    };
  }

  async generateCapabilityCoverageReport(tenantId: string, filters: ReportFilters) {
    const capabilities = await this.prisma.capabilityNode.findMany({
      where: { tenant_id: tenantId },
      include: {
        children: true,
        applications: {
          include: {
            application: {
              select: { id: true, name: true, lifecycle_state: true, risk_score: true }
            }
          }
        }
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });

    const totalApplications = await this.prisma.application.count({
      where: { tenant_id: tenantId }
    });

    const capabilityData = capabilities.map(cap => {
      const directApps = cap.applications?.length || 0;
      
      const childAppCounts = cap.children?.map((child: any) => {
        return 0; 
      }) || [];
      const totalApps = directApps + childAppCounts.reduce((a: number, b: number) => a + b, 0);
      
      const coveragePercent = totalApplications > 0 
        ? Math.round((totalApps / totalApplications) * 100) 
        : 0;

      return {
        id: cap.id,
        name: cap.name,
        level: cap.level,
        parent_id: cap.parent_id,
        direct_applications: directApps,
        child_applications: childAppCounts.reduce((a: number, b: number) => a + b, 0),
        total_applications: totalApps,
        coverage_percent: coveragePercent,
        strategic_importance: cap.strategic_importance,
        status: totalApps === 0 ? 'gap' : totalApps < 3 ? 'partial' : 'covered'
      };
    });

    const summary = {
      total_capabilities: capabilities.length,
      covered: capabilityData.filter(c => c.status === 'covered').length,
      partial: capabilityData.filter(c => c.status === 'partial').length,
      gaps: capabilityData.filter(c => c.status === 'gap').length,
      total_applications: totalApplications
    };

    return {
      generated_at: new Date().toISOString(),
      filters,
      summary,
      capabilities: capabilityData
    };
  }

  async generateItCostReport(tenantId: string, filters: ReportFilters) {
    const appWhere: any = { tenant_id: tenantId };
    if (filters.businessUnitId) appWhere.business_unit_id = filters.businessUnitId;
    if (filters.ownerId) appWhere.owner_id = filters.ownerId;

    const applications = await this.prisma.application.findMany({
      where: appWhere,
      include: {
        business_unit: true,
        costs: true
      }
    });

    const costByType: Record<string, number> = {};
    const costByBusinessUnit: Record<string, number> = {};
    const costByVendor: Record<string, number> = {};
    const applicationCosts: Record<string, number> = {};

    for (const app of applications) {
      let appTotal = 0;
      
      for (const cost of app.costs) {
        const amount = Number(cost.amount);
        appTotal += amount;
        
        costByType[cost.cost_type] = (costByType[cost.cost_type] || 0) + amount;
      }

      const buName = app.business_unit?.name || 'Unassigned';
      costByBusinessUnit[buName] = (costByBusinessUnit[buName] || 0) + appTotal;

      const vendor = app.vendor || 'Unknown';
      costByVendor[vendor] = (costByVendor[vendor] || 0) + appTotal;

      if (appTotal > 0) {
        applicationCosts[app.name] = appTotal;
      }
    }

    const totalCost = Object.values(applicationCosts).reduce((a, b) => a + b, 0);
    const topExpensive = Object.entries(applicationCosts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, cost]) => ({ name, cost }));

    return {
      generated_at: new Date().toISOString(),
      filters,
      summary: {
        total_cost: totalCost,
        application_count: applications.length,
        average_cost_per_app: applications.length > 0 ? totalCost / applications.length : 0
      },
      cost_by_type: costByType,
      cost_by_business_unit: costByBusinessUnit,
      cost_by_vendor: costByVendor,
      top_expensive_applications: topExpensive
    };
  }

  async generateEolRiskReport(tenantId: string, filters: ReportFilters) {
    const appWhere: any = { 
      tenant_id: tenantId,
      eol_date: { not: null }
    };
    if (filters.businessUnitId) appWhere.business_unit_id = filters.businessUnitId;

    const applications = await this.prisma.application.findMany({
      where: appWhere,
      include: {
        business_unit: true,
        owner: { select: { id: true, first_name: true, last_name: true, email: true } }
      },
      orderBy: { eol_date: 'asc' }
    });

    const now = new Date();
    const risks = {
      critical: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[],
      past: [] as any[]
    };

    for (const app of applications) {
      if (!app.eol_date) continue;
      
      const eolDate = new Date(app.eol_date);
      const daysUntil = Math.ceil((eolDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const appData = {
        id: app.id,
        name: app.name,
        vendor: app.vendor,
        eol_date: app.eol_date,
        days_until_eol: daysUntil,
        risk_score: app.risk_score,
        business_unit: app.business_unit?.name,
        owner: app.owner ? `${app.owner.first_name} ${app.owner.last_name}` : 'Unassigned'
      };

      if (daysUntil < 0) {
        risks.past.push(appData);
      } else if (daysUntil <= 30) {
        risks.critical.push(appData);
      } else if (daysUntil <= 90) {
        risks.high.push(appData);
      } else if (daysUntil <= 180) {
        risks.medium.push(appData);
      } else {
        risks.low.push(appData);
      }
    }

    return {
      generated_at: new Date().toISOString(),
      filters,
      summary: {
        total_at_risk: risks.critical.length + risks.high.length + risks.past.length,
        critical: risks.critical.length,
        high: risks.high.length,
        medium: risks.medium.length,
        low: risks.low.length,
        past_eol: risks.past.length
      },
      risks
    };
  }

  async getReportHistory(tenantId: string, limit: number = 10) {
    return [];
  }
}