import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantExportService {
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  /**
   * Exports all personal data for a tenant for GDPR data-portability requests.
   * Returns a structured JSON payload grouped by entity type.
   */
  async exportTenantData(tenantId: string) {
    const tenant = await this.db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;

    const [users, applications, auditLogs] = await Promise.all([
      this.db.user.findMany({
        where: { tenant_id: tenantId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          job_title: true,
          department: true,
          sso_provider: true,
          sso_subject: true,
          is_active: true,
          last_login_at: true,
          login_count: true,
          created_at: true,
          preferences: true,
        },
      }),
      this.db.application.findMany({
        where: { tenant_id: tenantId },
        select: {
          id: true,
          name: true,
          description: true,
          vendor: true,
          version: true,
          technology_type: true,
          lifecycle_state: true,
          risk_score: true,
          data_classification: true,
          created_at: true,
        },
      }),
      this.db.auditLog.findMany({
        where: { tenant_id: tenantId },
        select: {
          id: true,
          user_email: true,
          entity_type: true,
          entity_name: true,
          action: true,
          changes: true,
          ip_address: true,
          action_timestamp: true,
        },
        orderBy: { action_timestamp: 'desc' },
        take: 10000,
      }),
    ]);

    const applicationsSerialized = applications.map((a: any) => ({
      ...a,
      created_at: a.created_at?.toISOString(),
    }));

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        created_at: tenant.created_at?.toISOString(),
      },
      exported_at: new Date().toISOString(),
      counts: {
        users: users.length,
        applications: applications.length,
        audit_logs: auditLogs.length,
      },
      users,
      applications: applicationsSerialized,
      audit_logs: auditLogs.map((l: any) => ({
        ...l,
        action_timestamp: l.action_timestamp?.toISOString(),
      })),
    };
  }
}
