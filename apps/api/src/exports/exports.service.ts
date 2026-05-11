import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async getTemplates(tenantId: string, userId: string, type?: string) {
    const where: any = { tenant_id: tenantId };
    if (type) where.template_type = type;
    where.OR = [{ user_id: userId }, { is_shared: true }];

    return this.db.exportTemplate.findMany({
      where,
      orderBy: { usage_count: 'desc' },
    });
  }

  async createTemplate(tenantId: string, userId: string, data: any) {
    return this.db.exportTemplate.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        name: data.name,
        description: data.description,
        template_type: data.template_type,
        content: data.content || {},
        is_default: data.is_default || false,
        is_shared: data.is_shared || false,
      },
    });
  }

  async updateTemplate(id: string, tenantId: string, userId: string, data: any) {
    const template = await this.db.exportTemplate.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.db.exportTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        is_default: data.is_default,
        is_shared: data.is_shared,
      },
    });
  }

  async deleteTemplate(id: string, tenantId: string, userId: string) {
    const template = await this.db.exportTemplate.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return this.db.exportTemplate.delete({ where: { id } });
  }

  async useTemplate(id: string, tenantId: string) {
    const template = await this.db.exportTemplate.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.db.exportTemplate.update({
      where: { id },
      data: { usage_count: { increment: 1 } },
    });
  }

  async getScheduledExports(tenantId: string, userId: string) {
    return this.db.scheduledExport.findMany({
      where: { tenant_id: tenantId, user_id: userId },
      include: { template: true },
      orderBy: { next_run_at: 'asc' },
    });
  }

  async createScheduledExport(tenantId: string, userId: string, data: any) {
    const nextRun = this.calculateNextRun(data.frequency);
    return this.db.scheduledExport.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        name: data.name,
        template_id: data.template_id,
        format: data.format,
        frequency: data.frequency,
        recipients: data.recipients || [],
        filters: data.filters || {},
        next_run_at: nextRun,
        is_active: true,
      },
    });
  }

  async updateScheduledExport(id: string, tenantId: string, userId: string, data: any) {
    const export_ = await this.db.scheduledExport.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!export_) throw new NotFoundException('Scheduled export not found');

    const updateData: any = { ...data };
    if (data.frequency) {
      updateData.next_run_at = this.calculateNextRun(data.frequency);
    }

    return this.db.scheduledExport.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteScheduledExport(id: string, tenantId: string, userId: string) {
    const export_ = await this.db.scheduledExport.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!export_) throw new NotFoundException('Scheduled export not found');
    return this.db.scheduledExport.delete({ where: { id } });
  }

  async toggleScheduledExport(id: string, tenantId: string, userId: string) {
    const export_ = await this.db.scheduledExport.findFirst({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!export_) throw new NotFoundException('Scheduled export not found');

    return this.db.scheduledExport.update({
      where: { id },
      data: { is_active: !export_.is_active },
    });
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    now.setHours(9, 0, 0, 0);
    return now;
  }

  async generateReport(tenantId: string, templateId: string, format: string) {
    const template = await this.db.exportTemplate.findFirst({
      where: { id: templateId, tenant_id: tenantId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const content = template.content as any;
    let data: any = {};

    switch (content.dataType) {
      case 'saas':
        data = await this.db.saaSApplication.findMany({
          where: { tenant_id: tenantId },
          select: { vendor: true, annual_contract_value: true, use_case: true, contract_end_date: true },
        });
        break;
      case 'applications':
        data = await this.db.application.findMany({
          where: { tenant_id: tenantId },
          select: { name: true, lifecycle_state: true, owner: true },
        });
        break;
      case 'technology':
        data = await this.db.technologyComponent.findMany({
          where: { tenant_id: tenantId },
          select: { name: true, component_type: true, status: true, eol_date: true },
        });
        break;
      default:
        data = { message: 'No data configured' };
    }

    return { format, data, template_name: template.name };
  }
}