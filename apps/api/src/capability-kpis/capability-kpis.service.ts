import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CapabilityKpisService {
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private requireTenant(tenantId: string | undefined) {
    if (!tenantId) throw new BadRequestException('Tenant context required');
    return tenantId;
  }

  private async requireCapability(tenantId: string, capabilityId: string) {
    const cap = await this.db.capabilityNode.findFirst({
      where: { id: capabilityId, tenant_id: tenantId },
    });
    if (!cap) throw new NotFoundException('Capability not found');
    return cap;
  }

  async list(tenantId: string | undefined, capabilityId?: string) {
    const tenant = this.requireTenant(tenantId);
    const where: any = { tenant_id: tenant };
    if (capabilityId) {
      await this.requireCapability(tenant, capabilityId);
      where.capability_id = capabilityId;
    }
    const kpis = await this.db.capabilityKpi.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        values: {
          orderBy: { recorded_at: 'desc' },
          take: 12,
        },
      },
    });
    return { kpis };
  }

  async create(tenantId: string | undefined, capabilityId: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    await this.requireCapability(tenant, capabilityId);
    if (!dto?.name) throw new BadRequestException('name is required');
    const kpi = await this.db.capabilityKpi.create({
      data: {
        tenant_id: tenant,
        capability_id: capabilityId,
        name: dto.name,
        unit: dto.unit,
        description: dto.description,
      },
    });
    return { kpi };
  }

  private async requireKpi(tenantId: string, id: string) {
    const kpi = await this.db.capabilityKpi.findFirst({ where: { id, tenant_id: tenantId } });
    if (!kpi) throw new NotFoundException('KPI not found');
    return kpi;
  }

  async update(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    await this.requireKpi(tenant, id);
    const kpi = await this.db.capabilityKpi.update({
      where: { id },
      data: {
        name: dto.name,
        unit: dto.unit,
        description: dto.description,
      },
    });
    return { kpi };
  }

  async remove(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    await this.requireKpi(tenant, id);
    await this.db.capabilityKpiValue.deleteMany({ where: { kpi_id: id } });
    await this.db.capabilityKpi.delete({ where: { id } });
    return { deleted: true };
  }

  // ------------------------- Values / trend -------------------------

  async values(tenantId: string | undefined, id: string, limit = 30) {
    const tenant = this.requireTenant(tenantId);
    await this.requireKpi(tenant, id);
    const values = await this.db.capabilityKpiValue.findMany({
      where: { kpi_id: id },
      orderBy: { recorded_at: 'desc' },
      take: Number(limit) || 30,
    });
    return { kpi_id: id, values };
  }

  async recordValue(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    await this.requireKpi(tenant, id);
    const value = Number(dto?.value);
    if (!Number.isFinite(value)) throw new BadRequestException('value is required');
    const entry = await this.db.capabilityKpiValue.create({
      data: {
        kpi_id: id,
        value,
        recorded_at: dto.recorded_at ? new Date(dto.recorded_at) : undefined,
      },
    });
    return { value: entry };
  }

  /** Chronological series for the KPI trend chart. */
  async trend(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    await this.requireKpi(tenant, id);
    const kpi = await this.db.capabilityKpi.findUnique({ where: { id } });
    const rows = await this.db.capabilityKpiValue.findMany({
      where: { kpi_id: id },
      orderBy: { recorded_at: 'asc' },
    });
    return {
      kpi: { id: kpi.id, name: kpi.name, unit: kpi.unit },
      series: rows.map((r: any) => ({
        recorded_at: r.recorded_at,
        value: Number(r.value),
      })),
    };
  }
}