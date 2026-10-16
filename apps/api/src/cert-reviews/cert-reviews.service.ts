import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const ITEM_STATUS = ['pending', 'confirmed', 'revoked', 'escalated'];

@Injectable()
export class CertReviewsService {
  private readonly logger = new Logger(CertReviewsService.name);
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private requireTenant(tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Tenant context required');
    return tenantId;
  }

  /**
   * Create a quarterly certification cycle and generate review items
   * from the tenant's current user accounts and owned applications.
   */
  async createCycle(tenantId: string | undefined, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    if (!dto?.name) throw new BadRequestException('Cycle name is required');

    const dueAt = dto.due_at ? new Date(dto.due_at) : undefined;
    const cert = await this.db.accessCertification.create({
      data: {
        tenant_id: tenant,
        name: dto.name,
        period: dto.period || undefined,
        status: 'active',
        created_by: actor?.userId,
        due_at: dueAt,
      },
    });

    const users = await this.db.user.findMany({
      where: { tenant_id: tenant, is_active: true },
      select: { id: true, first_name: true, last_name: true, email: true },
    });

    const ownedApps = await this.db.application.findMany({
      where: { tenant_id: tenant, deleted_at: null },
      select: { id: true, name: true },
    });

    const items: any[] = [];
    for (const u of users) {
      items.push({
        certification_id: cert.id,
        user_id: u.id,
        resource_type: 'user',
        resource_id: u.id,
        resource_name: u.email || u.first_name || u.id,
        access_level: 'account',
      });
    }
    for (const a of ownedApps) {
      items.push({
        certification_id: cert.id,
        user_id: actor?.userId || users[0]?.id,
        resource_type: 'application',
        resource_id: a.id,
        resource_name: a.name,
        access_level: 'owner',
      });
    }

    if (items.length) {
      await this.db.accessCertificationItem.createMany({ data: items });
    }

    this.logger.log(
      `Created certification cycle "${dto.name}" with ${items.length} items`,
    );
    return this.getCycle(tenant, cert.id);
  }

  async listCycles(tenantId: string | undefined) {
    const tenant = this.requireTenant(tenantId);
    const cycles = await this.db.accessCertification.findMany({
      where: { tenant_id: tenant },
      orderBy: { created_at: 'desc' },
    });

    const counts = await this.db.accessCertificationItem.groupBy({
      by: ['certification_id'],
      _count: true,
    });
    const countMap = new Map(
      counts.map((c: any) => [c.certification_id, c._count]),
    );

    return cycles.map((c: any) => ({
      ...c,
      item_count: countMap.get(c.id) || 0,
    }));
  }

  async getCycle(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const cert = await this.db.accessCertification.findFirst({
      where: { id, tenant_id: tenant },
    });
    if (!cert) throw new NotFoundException('Certification cycle not found');

    const items = await this.db.accessCertificationItem.findMany({
      where: { certification_id: id },
      orderBy: { created_at: 'asc' },
    });
    return { ...cert, items };
  }

  /** Items awaiting review across the tenant's active cycles. */
  async pendingItems(tenantId: string | undefined, reviewerId: string) {
    const tenant = this.requireTenant(tenantId);
    const certs = await this.db.accessCertification.findMany({
      where: { tenant_id: tenant },
      select: { id: true, name: true },
    });
    const ids = certs.map((c: any) => c.id);
    if (!ids.length) return [];

    const items = await this.db.accessCertificationItem.findMany({
      where: { certification_id: { in: ids }, review_status: 'pending' },
      orderBy: { created_at: 'asc' },
    });

    const certById = new Map<string, any>(
      certs.map((c: any) => [c.id, c] as [string, any]),
    );
    return items.map((i: any) => ({
      ...i,
      cycle: {
        id: i.certification_id,
        name: certById.get(i.certification_id)?.name,
      },
    }));
  }

  async reviewItem(
    tenantId: string | undefined,
    itemId: string,
    dto: any,
    reviewerId: string,
  ) {
    const tenant = this.requireTenant(tenantId);
    const status = dto?.status;
    if (!ITEM_STATUS.includes(status)) {
      throw new BadRequestException(`Invalid review status '${status}'`);
    }
    if (status === 'pending') {
      throw new BadRequestException('Cannot set status back to pending');
    }

    const item = await this.db.accessCertificationItem.findFirst({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Certification item not found');

    const cert = await this.db.accessCertification.findFirst({
      where: { id: item.certification_id, tenant_id: tenant },
    });
    if (!cert) throw new NotFoundException('Certification cycle not found');

    return this.db.accessCertificationItem.update({
      where: { id: itemId },
      data: {
        review_status: status,
        reviewer_id: reviewerId,
        reviewed_at: new Date(),
        comment: dto.comment || undefined,
      },
    });
  }

  async completeCycle(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const cert = await this.db.accessCertification.findFirst({
      where: { id, tenant_id: tenant },
    });
    if (!cert) throw new NotFoundException('Certification cycle not found');
    return this.db.accessCertification.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  /** Escalate pending items in cycles whose due date has passed. */
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async escalateOverdue() {
    this.logger.log('Escalating overdue certification items...');
    try {
      const overdueCerts = await this.db.accessCertification.findMany({
        where: { status: 'active', due_at: { lt: new Date() } },
        select: { id: true },
      });
      for (const c of overdueCerts) {
        await this.db.accessCertificationItem.updateMany({
          where: { certification_id: c.id, review_status: 'pending' },
          data: { review_status: 'escalated' },
        });
      }
      if (overdueCerts.length) {
        this.logger.log(
          `Escalated pending items for ${overdueCerts.length} cycle(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Error escalating overdue items:', error);
    }
  }
}
