import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const RESERVED_SLUGS = [
  'admin',
  'api',
  'app',
  'auth',
  'login',
  'register',
  'settings',
  'onboarding',
  'www',
  'docs',
  'support',
  'graphql',
  'health',
  'metrics',
];

const DEFAULT_PLANS: Record<string, { quota: number; features: string[] }> = {
  starter: { quota: 100, features: ['graph_view'] },
  professional: {
    quota: 500,
    features: [
      'advanced_analytics',
      'graph_view',
      'custom_reports',
      'audit_logs',
    ],
  },
  enterprise: {
    quota: 2000,
    features: [
      'advanced_analytics',
      'graph_view',
      'custom_reports',
      'audit_logs',
      'ai_recommendations',
    ],
  },
};

@Injectable()
export class TenantsService {
  private db: any;
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {
    this.db = this.prisma as any;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgePendingDeletions() {
    this.logger.log('Purging tenants past their GDPR deletion due date...');
    try {
      const result = await this.hardDeleteDue();
      if (result.purged > 0) {
        this.logger.log(`Purged ${result.purged} tenant(s)`);
      }
    } catch (err) {
      this.logger.error('Error purging tenants:', err);
    }
  }

  async slugifyName(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    if (RESERVED_SLUGS.includes(base)) {
      throw new ConflictException(`The slug '${base}' is reserved`);
    }

    let candidate = base;
    let suffix = 1;
    while (await this.db.tenant.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  }

  async create(data: any) {
    const { name, plan = 'starter' } = data;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new BadRequestException('Tenant name is required');
    }
    if (!DEFAULT_PLANS[plan]) {
      throw new BadRequestException(`Invalid plan '${plan}'`);
    }

    const slug = data.slug || (await this.slugifyName(name));
    if (RESERVED_SLUGS.includes(slug)) {
      throw new ConflictException(`The slug '${slug}' is reserved`);
    }

    const existing = await this.db.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Tenant slug '${slug}' already exists`);
    }

    const settings = {
      ...(data.settings || {}),
      plan,
      quotas: { requests_per_minute: DEFAULT_PLANS[plan].quota },
      feature_flags: Object.fromEntries(
        DEFAULT_PLANS[plan].features.map((f) => [f, true]),
      ),
    };

    const tenant = await this.db.tenant.create({
      data: {
        name: name.trim(),
        slug,
        plan,
        settings,
      },
    });

    if (data.createdBy) {
      await this.auditLogs.create(tenant.id, {
        user_id: data.createdBy.userId,
        user_email: data.createdBy.email,
        entity_type: 'Tenant',
        entity_id: tenant.id,
        entity_name: tenant.name,
        action: 'CREATE',
        ip_address: data.createdBy.ipAddress,
        user_agent: data.createdBy.userAgent,
      });
    }

    return tenant;
  }

  async findAll() {
    return this.db.tenant.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        settings: true,
        created_at: true,
        updated_at: true,
        _count: { select: { users: true, applications: true } },
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.db.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, applications: true, audit_logs: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, data: any) {
    const existing = await this.db.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tenant not found');

    const { name, slug, plan } = data;

    if (slug && slug !== existing.slug) {
      if (RESERVED_SLUGS.includes(slug)) {
        throw new ConflictException(`The slug '${slug}' is reserved`);
      }
      const dup = await this.db.tenant.findUnique({ where: { slug } });
      if (dup)
        throw new ConflictException(`Tenant slug '${slug}' already exists`);
    }

    if (plan && plan !== existing.plan) {
      if (!DEFAULT_PLANS[plan]) {
        throw new BadRequestException(`Invalid plan: ${plan}`);
      }
    }

    const currentSettings = existing.settings || {};
    const settings = { ...currentSettings };
    if (plan && plan !== existing.plan) {
      settings.plan = plan;
      settings.quotas = { requests_per_minute: DEFAULT_PLANS[plan].quota };
      settings.feature_flags = Object.fromEntries(
        DEFAULT_PLANS[plan].features.map((f) => [f, true]),
      );
    }

    const tenant = await this.db.tenant.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(plan ? { plan, settings } : {}),
        ...(data.settings
          ? { settings: { ...settings, ...data.settings } }
          : {}),
      },
    });

    if (data.logBy) {
      await this.auditLogs.create(id, {
        user_id: data.logBy.userId,
        user_email: data.logBy.email,
        entity_type: 'Tenant',
        entity_id: id,
        entity_name: tenant.name,
        action: 'UPDATE',
        changes: [{ field: 'tenant', from: existing.name, to: tenant.name }],
        ip_address: data.logBy.ipAddress,
        user_agent: data.logBy.userAgent,
      });
    }

    return tenant;
  }

  async delete(id: string, actor: any) {
    const existing = await this.db.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tenant not found');

    await this.auditLogs.create(id, {
      user_id: actor?.userId,
      user_email: actor?.email,
      entity_type: 'Tenant',
      entity_id: id,
      entity_name: existing.name,
      action: 'DELETE',
      ip_address: actor?.ipAddress,
      user_agent: actor?.userAgent,
    });

    // 30-day grace period: mark as pending deletion instead of hard-deleting
    const settings = existing.settings || {};
    settings.pending_deletion = {
      requested_at: new Date().toISOString(),
      delete_after: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      requested_by: actor?.email,
    };

    await this.db.tenant.update({
      where: { id },
      data: { settings, plan: 'deleting' },
    });

    return {
      success: true,
      message: `Tenant ${existing.name} scheduled for deletion in 30 days`,
      delete_after: settings.pending_deletion.delete_after,
    };
  }

  async cancelDeletion(id: string) {
    const existing = await this.db.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tenant not found');

    const settings = existing.settings || {};
    if (!settings.pending_deletion) {
      throw new BadRequestException('Tenant is not pending deletion');
    }
    delete settings.pending_deletion;

    await this.db.tenant.update({
      where: { id },
      data: { settings, plan: settings.plan || 'starter' },
    });

    return { success: true, message: 'Tenant deletion cancelled' };
  }

  async hardDeleteDue(now = new Date()) {
    const tenants = await this.db.tenant.findMany({
      where: {
        plan: 'deleting',
      },
    });

    let purged = 0;
    for (const tenant of tenants) {
      const due = tenant.settings?.pending_deletion?.delete_after;
      if (due && new Date(due) <= now) {
        await this.db.tenant.delete({ where: { id: tenant.id } });
        purged++;
      }
    }
    return { purged };
  }
}
