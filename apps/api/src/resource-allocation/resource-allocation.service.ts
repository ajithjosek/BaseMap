import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceAllocationService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async findAll(tenantId: string, filters?: { user_id?: string; project_id?: string; active?: boolean }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.active !== undefined) where.is_active = filters.active;

    return this.db.resourceAllocation.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true, department: true } },
      },
      orderBy: { start_date: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const allocation = await this.db.resourceAllocation.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true, department: true } },
      },
    });
    if (!allocation) throw new NotFoundException('Resource allocation not found');
    return allocation;
  }

  async create(tenantId: string, data: {
    user_id: string;
    project_id?: string;
    resource_type: string;
    allocation_pct: number;
    start_date: string;
    end_date: string;
  }) {
    return this.db.resourceAllocation.create({
      data: {
        tenant_id: tenantId,
        user_id: data.user_id,
        project_id: data.project_id,
        resource_type: data.resource_type,
        allocation_pct: data.allocation_pct,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_active: true,
      },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.allocation_pct !== undefined) updateData.allocation_pct = data.allocation_pct;
    if (data.start_date) updateData.start_date = new Date(data.start_date);
    if (data.end_date) updateData.end_date = new Date(data.end_date);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return this.db.resourceAllocation.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.db.resourceAllocation.delete({ where: { id } });
  }

  async getTeamCapacity(tenantId: string) {
    const allocations = await this.db.resourceAllocation.findMany({
      where: { tenant_id: tenantId, is_active: true },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, department: true } },
      },
    });

    const byUser: Record<string, { user: any; total: number }> = {};
    for (const a of allocations) {
      if (!byUser[a.user_id]) {
        byUser[a.user_id] = { user: a.user, total: 0 };
      }
      byUser[a.user_id].total += a.allocation_pct;
    }

    const overCapacity = Object.values(byUser).filter(u => u.total > 100);
    const available = Object.values(byUser).filter(u => u.total < 100);

    return {
      total_users: Object.keys(byUser).length,
      over_capacity: overCapacity.length,
      at_capacity: available.filter(u => u.total === 100).length,
      under_capacity: available.filter(u => u.total < 100).length,
      by_user: Object.values(byUser),
    };
  }

  async getUtilizationByDepartment(tenantId: string) {
    const allocations = await this.db.resourceAllocation.findMany({
      where: { tenant_id: tenantId, is_active: true },
      include: {
        user: { select: { department: true } },
      },
    });

    const byDept: Record<string, { total_pct: number; count: number }> = {};
    for (const a of allocations) {
      const dept = a.user?.department || 'Unassigned';
      if (!byDept[dept]) byDept[dept] = { total_pct: 0, count: 0 };
      byDept[dept].total_pct += a.allocation_pct;
      byDept[dept].count += 1;
    }

    return Object.entries(byDept).map(([dept, data]) => ({
      department: dept,
      average_utilization: Math.round(data.total_pct / data.count),
      resource_count: data.count,
    }));
  }
}