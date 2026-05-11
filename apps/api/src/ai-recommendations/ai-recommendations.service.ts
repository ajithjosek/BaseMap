import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIRecommendationsService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async findAll(tenantId: string, filters?: { category?: string; priority?: string; resolved?: boolean }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.resolved !== undefined) where.is_resolved = filters.resolved;

    return this.db.aIRecommendation.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async findOne(id: string, tenantId: string) {
    const rec = await this.db.aIRecommendation.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!rec) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }
    return rec;
  }

  async resolve(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.db.aIRecommendation.update({
      where: { id },
      data: { is_resolved: true, resolved_at: new Date() },
    });
  }

  async getDashboardSummary(tenantId: string) {
    const all = await this.db.aIRecommendation.findMany({
      where: { tenant_id: tenantId },
      select: { category: true, priority: true, is_resolved: true, impact_score: true },
    });

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalImpact = 0;
    let resolved = 0;

    for (const r of all) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      if (r.is_resolved) resolved++;
      else totalImpact += r.impact_score || 0;
    }

    return {
      total: all.length,
      resolved,
      open: all.length - resolved,
      total_impact: totalImpact,
      by_category: byCategory,
      by_priority: byPriority,
    };
  }

  async generateInsights(tenantId: string) {
    const insights: any[] = [];

    const eolComponents = await this.db.technologyComponent.findMany({
      where: {
        tenant_id: tenantId,
        eol_date: { lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, name: true, eol_date: true, component_type: true },
    });

    for (const comp of eolComponents) {
      const daysUntilEOL = Math.ceil((new Date(comp.eol_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let priority = 'medium';
      let impact = 30;
      if (daysUntilEOL <= 30) { priority = 'critical'; impact = 100; }
      else if (daysUntilEOL <= 90) { priority = 'high'; impact = 70; }

      insights.push({
        category: 'eol_risk',
        title: `${comp.name} reaches EOL in ${daysUntilEOL} days`,
        description: `Component ${comp.name} (${comp.component_type}) is approaching end-of-life. Consider planning migration or upgrade.`,
        priority,
        confidence: 0.95,
        impact_score: impact,
        entity_type: 'technology_component',
        entity_id: comp.id,
      });
    }

    const lowUtilization = await this.db.saaSApplication.findMany({
      where: {
        tenant_id: tenantId,
        active_users: { lt: 5 },
        total_seats: { gt: 10 },
      },
      select: { id: true, vendor: true, annual_contract_value: true, total_seats: true, active_users: true },
    });

    for (const saas of lowUtilization) {
      const utilization = ((saas.active_users || 0) / (saas.total_seats || 1)) * 100;
      if (utilization < 30) {
        insights.push({
          category: 'underutilization',
          title: `Low utilization on ${saas.vendor}`,
          description: `${saas.vendor} has only ${utilization.toFixed(0)}% seat utilization (${saas.active_users}/${saas.total_seats} seats). Potential cost savings of $${(saas.annual_contract_value || 0) * 0.5}/year by reducing seats.`,
          priority: utilization < 10 ? 'high' : 'medium',
          confidence: 0.85,
          impact_score: Math.round((saas.annual_contract_value || 0) * 0.3),
          entity_type: 'saas_application',
          entity_id: saas.id,
        });
      }
    }

    const expiringContracts = await this.db.saaSApplication.findMany({
      where: {
        tenant_id: tenantId,
        contract_end_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, vendor: true, contract_end_date: true, annual_contract_value: true },
    });

    for (const saas of expiringContracts) {
      const daysUntil = Math.ceil((new Date(saas.contract_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      insights.push({
        category: 'renewal',
        title: `${saas.vendor} contract expires in ${daysUntil} days`,
        description: `Contract for ${saas.vendor} ($${(saas.annual_contract_value || 0).toLocaleString()}/year) needs renewal decision.`,
        priority: daysUntil <= 30 ? 'high' : 'medium',
        confidence: 0.9,
        impact_score: Math.round((saas.annual_contract_value || 0) * 0.5),
        entity_type: 'saas_application',
        entity_id: saas.id,
      });
    }

    return insights;
  }

  async bulkCreate(tenantId: string, recommendations: any[]) {
    const created: any[] = [];
    for (const rec of recommendations) {
      const createdRec = await this.db.aIRecommendation.create({
        data: {
          tenant_id: tenantId,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          priority: rec.priority || 'medium',
          confidence: rec.confidence || 0.5,
          impact_score: rec.impact_score || 0,
          entity_type: rec.entity_type,
          entity_id: rec.entity_id,
          metadata: rec.metadata || {},
        },
      });
      created.push(createdRec);
    }
    return created;
  }
}