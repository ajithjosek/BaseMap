import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReportingService {
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  /**
   * Aggregate usage statistics across all tenants for platform admins.
   * Metrics: tenants, active users, applications, costs and operational volume.
   */
  async crossTenantOverview() {
    const since30d = new Date(Date.now() - THIRTY_DAYS);
    const now = new Date();

    const [
      totalTenants,
      activeTenants,
      tenantsPendingDeletion,
      tenantsByPlan,
      newTenants30d,
      totalUsers,
      activeUsers,
      totalApplications,
      applicationsByLifecycle,
      costAgg,
      costsByCurrency,
      totalSaaS,
      totalComponents,
      totalInterfaces,
      totalCapabilities,
      totalAuditLogs,
      totalExportJobs,
    ] = await this.prisma.$transaction([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { NOT: { plan: 'deleting' } } }),
      this.prisma.tenant.count({ where: { plan: 'deleting' } }),
      this.prisma.tenant.groupBy({ by: ['plan'], _count: true, orderBy: { plan: 'asc' } }),
      this.prisma.tenant.count({ where: { created_at: { gte: since30d } } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { is_active: true } }),
      this.prisma.application.count(),
      this.prisma.application.groupBy({
        by: ['lifecycle_state'],
        _count: true,
        orderBy: { lifecycle_state: 'asc' },
      }),
      this.prisma.applicationCost.aggregate({ _sum: { amount: true } }),
      this.prisma.applicationCost.groupBy({
        by: ['currency'],
        _sum: { amount: true },
        orderBy: { currency: 'asc' },
      }),
      this.prisma.saaSApplication.count(),
      this.prisma.technologyComponent.count(),
      this.prisma.interface.count(),
      this.prisma.capabilityNode.count(),
      this.prisma.auditLog.count(),
      this.prisma.exportJob.count(),
    ]);

    return {
      generated_at: now,
      tenants: {
        total: totalTenants,
        active: activeTenants,
        pending_deletion: tenantsPendingDeletion,
        new_last_30_days: newTenants30d,
        by_plan: this.mapCounts(tenantsByPlan, 'plan'),
      },
      users: { total: totalUsers, active: activeUsers },
      applications: {
        total: totalApplications,
        by_lifecycle: this.mapCounts(applicationsByLifecycle, 'lifecycle_state'),
      },
      costs: {
        total_usd: Number(costAgg._sum?.amount || 0),
        by_currency: costsByCurrency.map((c: any) => ({
          currency: c.currency,
          amount: Number(c._sum?.amount || 0),
        })),
      },
      inventory: {
        saas_applications: totalSaaS,
        technology_components: totalComponents,
        interfaces: totalInterfaces,
        capabilities: totalCapabilities,
      },
      activity: {
        audit_logs: totalAuditLogs,
        export_jobs: totalExportJobs,
      },
    };
  }

  private mapCounts(rows: any[], key: string) {
    return rows.map((r: any) => ({ [key]: r[key], count: r._count }));
  }
}