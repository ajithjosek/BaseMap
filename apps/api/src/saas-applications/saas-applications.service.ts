import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaaSApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenant_id: tenantId };

    if (search) {
      where.OR = [
        { vendor: { contains: search, mode: 'insensitive' } },
        { use_case: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.saaSApplication.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        application: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const app = await this.prisma.saaSApplication.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        application: true,
      },
    });

    if (!app) {
      throw new NotFoundException('SaaS application not found');
    }

    return app;
  }

  async create(tenantId: string, userId: string, dto: any) {
    return this.prisma.saaSApplication.create({
      data: {
        tenant_id: tenantId,
        vendor: dto.vendor,
        product_url: dto.product_url,
        use_case: dto.use_case,
        pricing_model: dto.pricing_model,
        annual_contract_value: dto.annual_contract_value ? Number(dto.annual_contract_value) : null,
        contract_start_date: dto.contract_start_date ? new Date(dto.contract_start_date) : null,
        contract_end_date: dto.contract_end_date ? new Date(dto.contract_end_date) : null,
        auto_renewal: dto.auto_renewal ?? false,
        total_seats: dto.total_seats ? parseInt(dto.total_seats) : null,
        data_residency: dto.data_residency,
        has_dpa: dto.has_dpa ?? false,
        is_shadow_it: dto.is_shadow_it ?? false,
        discovered_at: new Date(),
      },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (dto.vendor !== undefined) data.vendor = dto.vendor;
    if (dto.product_url !== undefined) data.product_url = dto.product_url;
    if (dto.use_case !== undefined) data.use_case = dto.use_case;
    if (dto.pricing_model !== undefined) data.pricing_model = dto.pricing_model;
    if (dto.annual_contract_value !== undefined) data.annual_contract_value = dto.annual_contract_value ? Number(dto.annual_contract_value) : null;
    if (dto.contract_start_date !== undefined) data.contract_start_date = dto.contract_start_date ? new Date(dto.contract_start_date) : null;
    if (dto.contract_end_date !== undefined) data.contract_end_date = dto.contract_end_date ? new Date(dto.contract_end_date) : null;
    if (dto.auto_renewal !== undefined) data.auto_renewal = dto.auto_renewal;
    if (dto.total_seats !== undefined) data.total_seats = dto.total_seats ? parseInt(dto.total_seats) : null;
    if (dto.data_residency !== undefined) data.data_residency = dto.data_residency;
    if (dto.has_dpa !== undefined) data.has_dpa = dto.has_dpa;
    if (dto.is_shadow_it !== undefined) data.is_shadow_it = dto.is_shadow_it;

    return this.prisma.saaSApplication.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.saaSApplication.delete({ where: { id } });
  }
}
