import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransformationProjectDto, UpdateTransformationProjectDto } from './dto/create-transformation-project.dto';

@Injectable()
export class TransformationProjectsService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async findAll(tenantId: string, filters?: { status?: string; category?: string; priority?: string }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;

    return this.db.transformationProject.findMany({
      where,
      orderBy: { start_date: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.db.transformationProject.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!project) {
      throw new NotFoundException(`Transformation project ${id} not found`);
    }
    return project;
  }

  async create(tenantId: string, dto: CreateTransformationProjectDto) {
    return this.db.transformationProject.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        description: dto.description,
        status: dto.status || 'planning',
        priority: dto.priority || 'medium',
        category: dto.category,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        progress: dto.progress || 0,
        budget: dto.budget,
        owner: dto.owner,
        dependencies: dto.dependencies,
        risks: dto.risks,
        milestones: dto.milestones || [],
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateTransformationProjectDto) {
    await this.findOne(id, tenantId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.start_date !== undefined) updateData.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) updateData.end_date = new Date(dto.end_date);
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.budget !== undefined) updateData.budget = dto.budget;
    if (dto.owner !== undefined) updateData.owner = dto.owner;
    if (dto.dependencies !== undefined) updateData.dependencies = dto.dependencies;
    if (dto.risks !== undefined) updateData.risks = dto.risks;
    if (dto.milestones !== undefined) updateData.milestones = dto.milestones;

    return this.db.transformationProject.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.db.transformationProject.delete({ where: { id } });
  }

  async getGanttData(tenantId: string) {
    const projects = await this.db.transformationProject.findMany({
      where: { tenant_id: tenantId },
      orderBy: { start_date: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        start_date: true,
        end_date: true,
        progress: true,
        owner: true,
      },
    });

    return projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      start: p.start_date.getTime(),
      end: p.end_date.getTime(),
      progress: p.progress,
      owner: p.owner,
    }));
  }

  async getStats(tenantId: string) {
    const projects = await this.db.transformationProject.findMany({
      where: { tenant_id: tenantId },
      select: { status: true, progress: true, budget: true },
    });

    const byStatus: Record<string, number> = {};
    let totalProgress = 0;
    let totalBudget = 0;

    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      totalProgress += p.progress || 0;
      totalBudget += Number(p.budget || 0);
    }

    return {
      total: projects.length,
      by_status: byStatus,
      avg_progress: projects.length ? Math.round(totalProgress / projects.length) : 0,
      total_budget: totalBudget,
    };
  }
}