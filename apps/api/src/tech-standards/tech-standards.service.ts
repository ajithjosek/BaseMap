import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { versionAllowed } from './version-range';

const CATEGORIES = ['language', 'database', 'os', 'cloud_provider', 'framework', 'tool'];
const STATUSES = ['proposed', 'in_review', 'active', 'rejected', 'deprecated', 'retired'];

/** Allowed transitions for the standards approval/lifecycle state machine. */
const TRANSITIONS: Record<string, string[]> = {
  proposed: ['in_review', 'rejected', 'deprecated'],
  in_review: ['active', 'rejected', 'proposed'],
  active: ['deprecated'],
  deprecated: ['retired', 'active'],
  rejected: ['proposed'],
  retired: [],
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 60,
  pro: 300,
  enterprise: 1200,
};

@Injectable()
export class TechStandardsService {
  private readonly logger = new Logger(TechStandardsService.name);
  private readonly db: any;
  private readonly complianceCache = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private requireTenant(tenantId: string | undefined) {
    if (!tenantId) throw new BadRequestException('Tenant context required');
    return tenantId;
  }

  // ------------------------- 38.2 Categories -------------------------

  private async ensureDefaultCategories(tenantId: string) {
    const existing = await this.db.techStandardCategory.findMany({
      where: { tenant_id: tenantId },
      select: { name: true },
    });
    const have = new Set(existing.map((c: any) => c.name));
    const fresh = CATEGORIES.filter((n) => !have.has(n)).map((n) => ({
      tenant_id: tenantId,
      name: n,
      description: null,
    }));
    if (fresh.length) await this.db.techStandardCategory.createMany({ data: fresh });
  }

  async listCategories(tenantId: string | undefined) {
    const tenant = this.requireTenant(tenantId);
    await this.ensureDefaultCategories(tenant);
    const categories = await this.db.techStandardCategory.findMany({
      where: { tenant_id: tenant },
      orderBy: { name: 'asc' },
    });
    return { categories };
  }

  async createCategory(tenantId: string | undefined, dto: any) {
    const tenant = this.requireTenant(tenantId);
    if (!dto?.name) throw new BadRequestException('name is required');
    const cat = await this.db.techStandardCategory.create({
      data: { tenant_id: tenant, name: dto.name.toLowerCase(), description: dto.description },
    });
    return { category: cat };
  }

  async updateCategory(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    const existing = await this.db.techStandardCategory.findFirst({
      where: { id, tenant_id: tenant },
    });
    if (!existing) throw new NotFoundException('Category not found');
    const cat = await this.db.techStandardCategory.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.toLowerCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return { category: cat };
  }

  async removeCategory(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const existing = await this.db.techStandardCategory.findFirst({
      where: { id, tenant_id: tenant },
    });
    if (!existing) throw new NotFoundException('Category not found');
    await this.db.techStandardCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ------------------------- 38.1 Standards CRUD -------------------------

  async create(tenantId: string | undefined, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    if (!dto?.name || !dto?.category) throw new BadRequestException('name and category required');
    const standard = await this.db.techStandard.create({
      data: {
        tenant_id: tenant,
        name: dto.name,
        category: dto.category.toLowerCase(),
        status: dto.status && STATUSES.includes(dto.status) ? dto.status : 'proposed',
        version_range: dto.version_range,
        sunset_date: dto.sunset_date ? new Date(dto.sunset_date) : null,
        notes: dto.notes,
        created_by: actor?.userId,
      },
    });
    this.invalidateCache(tenant);
    return { standard };
  }

  async list(tenantId: string | undefined, status?: string, category?: string) {
    const tenant = this.requireTenant(tenantId);
    const where: any = { tenant_id: tenant };
    if (status && STATUSES.includes(status)) where.status = status;
    if (category) where.category = category.toLowerCase();
    const standards = await this.db.techStandard.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return { standards, categories: CATEGORIES, statuses: STATUSES };
  }

  async get(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const standard = await this.db.techStandard.findFirst({ where: { id, tenant_id: tenant } });
    if (!standard) throw new NotFoundException('Standard not found');
    return { standard };
  }

  async update(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    await this.get(tenant, id);
    const standard = await this.db.techStandard.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category ? dto.category.toLowerCase() : undefined,
        version_range: dto.version_range,
        sunset_date: dto.sunset_date ? new Date(dto.sunset_date) : undefined,
        notes: dto.notes,
      },
    });
    this.invalidateCache(tenant);
    return { standard };
  }

  async remove(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    await this.get(tenantId, id);
    await this.db.techStandard.delete({ where: { id } });
    this.invalidateCache(tenant);
    return { deleted: true };
  }

  // ------------------------- 38.5 Approval workflow transition -------------------------

  async transition(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    const { standard } = await this.get(tenant, id);
    const to = dto?.to;
    if (!to) throw new BadRequestException('Target status (to) is required');
    if (!STATUSES.includes(to)) throw new BadRequestException(`Invalid status '${to}'`);
    const allowed = TRANSITIONS[standard.status] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Cannot move '${standard.status}' -> '${to}'`);
    }
    const updated = await this.db.techStandard.update({
      where: { id },
      data: { status: to, notes: dto.note ? `${standard.notes || ''}\n[${standard.status}->${to}] ${dto.note}`.trim() : standard.notes },
    });
    this.invalidateCache(tenant);
    return { standard: updated };
  }

  // ------------------------- 38.6 Lifecycle scheduled job -------------------------

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async autoRetire() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const retiredAge = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const active = await this.db.techStandard.findMany({
      where: { status: { in: ['proposed', 'in_review', 'active'] }, sunset_date: { lte: today } },
    });
    for (const s of active) {
      await this.db.techStandard.update({ where: { id: s.id }, data: { status: 'deprecated' } });
      this.invalidateCache(s.tenant_id);
    }

    const deprecated = await this.db.techStandard.findMany({
      where: { status: 'deprecated', sunset_date: { lte: retiredAge } },
    });
    for (const s of deprecated) {
      await this.db.techStandard.update({ where: { id: s.id }, data: { status: 'retired' } });
      this.invalidateCache(s.tenant_id);
    }

    this.logger.log(`Auto-retire: ${active.length} deprecated, ${deprecated.length} retired.`);
  }

  // ------------------------- 38.3 Compliance scoring -------------------------

  private invalidateCache(tenantId: string) {
    for (const key of [...this.complianceCache.keys()]) {
      if (key.startsWith(`${tenantId}:`)) this.complianceCache.delete(key);
    }
  }

  private getComponentVersion(component: any): string | undefined {
    return component?.software_details?.version || component?.version || undefined;
  }

  /** Find the standard governing a component (name match preferred over category). */
  private matchStandard(standards: any[], componentType: string): any | null {
    const t = String(componentType || '').toLowerCase();
    const byName = standards.find((s) => String(s.name).toLowerCase() === t);
    if (byName) return byName;
    return standards.find((s) => String(s.category).toLowerCase() === t) || null;
  }

  private classify(component: any, standards: any[]) {
    const std = this.matchStandard(standards, component.component_type);
    if (!std) return { standard: null, status: 'not_covered' };
    const version = this.getComponentVersion(component);
    const inRange = versionAllowed(version, std.version_range);
    if (std.status === 'active') {
      return { standard: std, status: inRange ? 'compliant' : 'non_compliant', reason: inRange ? null : 'version outside allowed range' };
    }
    if (std.status === 'deprecated') return { standard: std, status: 'nonstandard', reason: 'deprecated standard' };
    if (std.status === 'retired') return { standard: std, status: 'nonstandard', reason: 'retired standard' };
    if (std.status === 'in_review' || std.status === 'proposed') return { standard: std, status: 'pending', reason: `${std.status} standard` };
    if (std.status === 'rejected') return { standard: std, status: 'not_covered' };
    return { standard: std, status: 'not_covered' };
  }

  async scoreApplication(tenantId: string, applicationId: string) {
    const tenant = this.requireTenant(tenantId);
    const cacheKey = `${tenant}:app:${applicationId}`;
    const cached = this.complianceCache.get(cacheKey);
    if (cached) return cached;

    const application = await this.db.application.findFirst({
      where: { id: applicationId, tenant_id: tenant },
    });
    if (!application) throw new NotFoundException('Application not found');

    const components = await this.db.technologyComponent.findMany({
      where: { tenant_id: tenant, applications: { some: { application_id: applicationId } } },
    });
    const standards = await this.db.techStandard.findMany({ where: { tenant_id: tenant } });

    const rows = components.map((c: any) => ({
      component_id: c.id,
      name: c.name,
      component_type: c.component_type,
      version: this.getComponentVersion(c),
      ...this.classify(c, standards),
    }));

    const total = rows.length;
    const compliant = rows.filter((r) => r.status === 'compliant').length;
    const flagged = rows.filter((r) => r.status === 'nonstandard').length;
    const pending = rows.filter((r) => r.status === 'pending').length;
    const notCovered = rows.filter((r) => r.status === 'not_covered').length;
    const score = total ? Math.round((compliant / total) * 100) : 100;

    const result = {
      application: { id: application.id, name: application.name },
      score,
      total,
      compliant,
      flagged,
      pending,
      not_covered: notCovered,
      components: rows,
    };
    this.complianceCache.set(cacheKey, result);
    return result;
  }

  async complianceOverview(tenantId: string | undefined) {
    const tenant = this.requireTenant(tenantId);
    const applications = await this.db.application.findMany({
      where: { tenant_id: tenant },
      select: { id: true, name: true },
    });
    const standards = await this.db.techStandard.findMany({ where: { tenant_id: tenant } });

    const byStatus: Record<string, number> = {};
    for (const s of standards) byStatus[s.status] = (byStatus[s.status] || 0) + 1;

    const appRows = await Promise.all(
      applications.map(async (a: any) => {
        try {
          const sc = await this.scoreApplication(tenant, a.id);
          return { application_id: a.id, name: a.name, score: sc.score, flagged: sc.flagged, compliant: sc.compliant, total: sc.total };
        } catch {
          return null;
        }
      }),
    );
    const covered = appRows.filter(Boolean);

    const overall = covered.length
      ? Math.round(
          (covered.reduce((sum, r: any) => sum + r.score, 0) / covered.length) * 1,
        )
      : 100;

    const flaggedApps = covered.filter((r: any) => r && (r.flagged > 0 || r.score < 100));

    return {
      standards_count: standards.length,
      standards_by_status: byStatus,
      overall_score: overall,
      applications: covered,
      affected_applications: flaggedApps,
    };
  }

  async listComponentFlags(tenantId: string | undefined) {
    const tenant = this.requireTenant(tenantId);
    const components = await this.db.technologyComponent.findMany({
      where: { tenant_id: tenant },
      include: { applications: { select: { application_id: true } } },
    });
    const standards = await this.db.techStandard.findMany({ where: { tenant_id: tenant } });
    return {
      components: components.map((c: any) => ({
        id: c.id,
        name: c.name,
        component_type: c.component_type,
        version: this.getComponentVersion(c),
        ...this.classify(c, standards),
      })),
    };
  }

  // ------------------------- Rate limit plan lookup -------------------------

  planLimit(plan: string | undefined): number {
    return PLAN_LIMITS[plan || 'starter'] ?? PLAN_LIMITS.starter;
  }
}