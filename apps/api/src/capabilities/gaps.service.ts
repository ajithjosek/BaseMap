import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGapDto, UpdateGapDto } from './dto/gap.dto';

@Injectable()
export class GapsService {
  constructor(private prisma: PrismaService) {}

  private get db() {
    return this.prisma as any;
  }

  async create(tenantId: string, dto: CreateGapDto, userId?: string) {
    return this.db.capabilityGap.create({
      data: {
        tenant_id: tenantId,
        capability_id: dto.capability_id,
        title: dto.title,
        description: dto.description,
        impact: dto.impact,
        proposed_solution: dto.proposed_solution,
        severity: dto.severity || 'Medium',
        status: 'Open',
        created_by: userId,
      },
      include: {
        capability: true,
      },
    });
  }

  async findAll(tenantId: string, filters?: { status?: string; severity?: string; capabilityId?: string }) {
    const where: any = { tenant_id: tenantId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.capabilityId) {
      where.capability_id = filters.capabilityId;
    }

    return this.db.capabilityGap.findMany({
      where,
      include: {
        capability: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const gap = await this.db.capabilityGap.findUnique({
      where: { id },
      include: {
        capability: {
          include: {
            parent: true,
            children: true,
          },
        },
      },
    });

    if (!gap) throw new NotFoundException('Gap not found');
    return gap;
  }

  async update(id: string, tenantId: string, dto: UpdateGapDto) {
    const existing = await this.db.capabilityGap.findUnique({
      where: { id, tenant_id: tenantId },
    });

    if (!existing) throw new NotFoundException('Gap not found');

    const data: any = { ...dto };
    
    if (dto.status && dto.status !== existing.status && dto.status === 'Closed') {
      data.closed_at = new Date();
    }

    return this.db.capabilityGap.update({
      where: { id },
      data,
      include: {
        capability: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.db.capabilityGap.findUnique({
      where: { id, tenant_id: tenantId },
    });

    if (!existing) throw new NotFoundException('Gap not found');

    await this.db.capabilityGap.delete({ where: { id } });
    return { success: true };
  }

  async getGapStats(tenantId: string) {
    const [total, open, closed, bySeverity] = await Promise.all([
      this.db.capabilityGap.count({ where: { tenant_id: tenantId } }),
      this.db.capabilityGap.count({ where: { tenant_id: tenantId, status: 'Open' } }),
      this.db.capabilityGap.count({ where: { tenant_id: tenantId, status: 'Closed' } }),
      this.db.capabilityGap.groupBy({
        by: ['severity'],
        where: { tenant_id: tenantId, status: 'Open' },
        _count: true,
      }),
    ]);

    return {
      total,
      open,
      closed,
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async detectGaps(tenantId: string) {
    const capabilities = await this.prisma.capabilityNode.findMany({
      where: { tenant_id: tenantId },
      include: {
        _count: { select: { applications: true } },
        children: {
          include: {
            _count: { select: { applications: true } },
          },
        },
      },
    });

    const gaps: string[] = [];
    
    for (const cap of capabilities) {
      const hasApp = cap._count.applications > 0;
      const childrenHaveApps = cap.children.some((c: any) => c._count.applications > 0);
      
      if (!hasApp && !childrenHaveApps) {
        gaps.push(cap.id);
      }
    }

    return gaps;
  }

  async autoCreateGaps(tenantId: string) {
    const gapCapIds = await this.detectGaps(tenantId);
    const createdGaps: any[] = [];

    for (const capId of gapCapIds) {
      const existingGap = await this.db.capabilityGap.findFirst({
        where: { tenant_id: tenantId, capability_id: capId, status: 'Open' },
      });

      if (!existingGap) {
        const cap = await this.prisma.capabilityNode.findUnique({ where: { id: capId } });
        if (cap) {
          const gap = await this.db.capabilityGap.create({
            data: {
              tenant_id: tenantId,
              capability_id: capId,
              title: `Gap: ${cap.name} has no applications mapped`,
              description: `Capability "${cap.name}" at level ${cap.level} has no applications supporting it.`,
              impact: 'This capability is not being fulfilled by any application in the portfolio.',
              severity: cap.level === 1 ? 'High' : 'Medium',
            },
          });
          createdGaps.push(gap);
        }
      }
    }

    return createdGaps;
  }

  async getGapTrend(tenantId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const gaps = await this.db.capabilityGap.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: startDate },
      },
      select: {
        created_at: true,
        status: true,
        closed_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const openedByMonth: Record<string, number> = {};
    const closedByMonth: Record<string, number> = {};

    for (const gap of gaps) {
      const monthKey = gap.created_at.toISOString().slice(0, 7);
      openedByMonth[monthKey] = (openedByMonth[monthKey] || 0) + 1;

      if (gap.closed_at) {
        const closedMonth = gap.closed_at.toISOString().slice(0, 7);
        closedByMonth[closedMonth] = (closedByMonth[closedMonth] || 0) + 1;
      }
    }

    return { opened: openedByMonth, closed: closedByMonth };
  }
}