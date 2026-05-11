import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async findAll(
    tenantId: string,
    filters?: {
      entity_type?: string;
      action?: string;
      user_id?: string;
      start_date?: string;
      end_date?: string;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = { tenant_id: tenantId };

    if (filters?.entity_type) where.entity_type = filters.entity_type;
    if (filters?.action) where.action = filters.action;
    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.start_date || filters?.end_date) {
      where.action_timestamp = {};
      if (filters?.start_date) where.action_timestamp.gte = new Date(filters.start_date);
      if (filters?.end_date) where.action_timestamp.lte = new Date(filters.end_date);
    }

    const [logs, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        include: { user: { select: { first_name: true, last_name: true, email: true } } },
        orderBy: { action_timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const log = await this.db.auditLog.findFirst({
      where: { id, tenant_id: tenantId },
      include: { user: { select: { first_name: true, last_name: true, email: true } } },
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }

  async getStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.db.auditLog.findMany({
      where: {
        tenant_id: tenantId,
        action_timestamp: { gte: startDate },
      },
      select: { action: true, entity_type: true },
    });

    const byAction: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
    }

    return {
      total: logs.length,
      by_action: byAction,
      by_entity_type: byEntityType,
      period_days: days,
    };
  }

  async getEntityHistory(entityType: string, entityId: string, tenantId: string) {
    return this.db.auditLog.findMany({
      where: {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
      },
      include: { user: { select: { first_name: true, last_name: true, email: true } } },
      orderBy: { action_timestamp: 'desc' },
    });
  }

  async create(tenantId: string, data: {
    user_id?: string;
    user_email?: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    action: string;
    changes?: any;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
  }) {
    return this.db.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: data.user_id,
        user_email: data.user_email,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        entity_name: data.entity_name,
        action: data.action,
        changes: data.changes || [],
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        session_id: data.session_id,
      },
    });
  }
}