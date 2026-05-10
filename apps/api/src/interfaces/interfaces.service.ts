import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterfaceDto, UpdateInterfaceDto, CreateIncidentDto } from './dto/interface.dto';

@Injectable()
export class InterfacesService {
  constructor(private prisma: PrismaService) {}

  private get db() {
    return this.prisma as any;
  }

  async create(tenantId: string, dto: CreateInterfaceDto, userId?: string) {
    return this.db.interface.create({
      data: {
        tenant_id: tenantId,
        ...dto,
        created_by: userId,
      },
      include: {
        source_application: { select: { id: true, name: true } },
        target_application: { select: { id: true, name: true } },
        owner: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });
  }

  async findAll(tenantId: string, filters?: { 
    search?: string; 
    type?: string; 
    status?: string; 
    sourceAppId?: string;
    targetAppId?: string;
  }) {
    const where: any = { tenant_id: tenantId };
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.type) where.interface_type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.sourceAppId) where.source_application_id = filters.sourceAppId;
    if (filters?.targetAppId) where.target_application_id = filters.targetAppId;

    return this.db.interface.findMany({
      where,
      include: {
        source_application: { select: { id: true, name: true } },
        target_application: { select: { id: true, name: true } },
        owner: { select: { id: true, first_name: true, last_name: true, email: true } },
        _count: { select: { incidents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const interface_ = await this.db.interface.findUnique({
      where: { id },
      include: {
        source_application: { select: { id: true, name: true, lifecycle_state: true } },
        target_application: { select: { id: true, name: true, lifecycle_state: true } },
        owner: { select: { id: true, first_name: true, last_name: true, email: true } },
        incidents: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });
    if (!interface_) throw new NotFoundException('Interface not found');
    return interface_;
  }

  async update(id: string, tenantId: string, dto: UpdateInterfaceDto) {
    const existing = await this.db.interface.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Interface not found');

    return this.db.interface.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
      include: {
        source_application: { select: { id: true, name: true } },
        target_application: { select: { id: true, name: true } },
        owner: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.db.interface.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Interface not found');

    await this.db.interface.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    return this.update(id, tenantId, { status: status as any });
  }

  async getLineage(interfaceId: string, tenantId: string) {
    const interface_ = await this.findOne(interfaceId);
    
    const lineage = {
      interface: interface_,
      path: [] as any[],
    };

    if (interface_.source_application_id) {
      const sourceApp = await this.db.application.findUnique({
        where: { id: interface_.source_application_id },
        include: {
          interfaces_as_target: { select: { id: true, name: true } },
          capabilities: { include: { capability: true } },
        },
      });
      lineage.path.push({ type: 'source', data: sourceApp });
    }

    if (interface_.target_application_id) {
      const targetApp = await this.db.application.findUnique({
        where: { id: interface_.target_application_id },
        include: {
          interfaces_as_source: { select: { id: true, name: true } },
          capabilities: { include: { capability: true } },
        },
      });
      lineage.path.push({ type: 'target', data: targetApp });
    }

    return lineage;
  }

  async createIncident(tenantId: string, interfaceId: string, dto: CreateIncidentDto, userId?: string) {
    return this.db.interfaceIncident.create({
      data: {
        tenant_id: tenantId,
        interface_id: interfaceId,
        ...dto,
        created_by: userId,
      },
      include: {
        interface: { select: { id: true, name: true } },
      },
    });
  }

  async getIncidents(tenantId: string, interfaceId?: string) {
    const where: any = { tenant_id: tenantId };
    if (interfaceId) where.interface_id = interfaceId;

    return this.db.interfaceIncident.findMany({
      where,
      include: {
        interface: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async resolveIncident(id: string, tenantId: string, resolutionNotes: string) {
    const incident = await this.db.interfaceIncident.findUnique({
      where: { id, tenant_id: tenantId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    return this.db.interfaceIncident.update({
      where: { id },
      data: {
        status: 'Resolved',
        resolved_at: new Date(),
        resolution_notes: resolutionNotes,
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, operational, degraded, down, openIncidents] = await Promise.all([
      this.db.interface.count({ where: { tenant_id: tenantId } }),
      this.db.interface.count({ where: { tenant_id: tenantId, status: 'Operational' } }),
      this.db.interface.count({ where: { tenant_id: tenantId, status: 'Degraded' } }),
      this.db.interface.count({ where: { tenant_id: tenantId, status: 'Down' } }),
      this.db.interfaceIncident.count({ where: { tenant_id: tenantId, status: 'Open' } }),
    ]);

    return { total, operational, degraded, down, open_incidents: openIncidents };
  }
}