import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCapabilityDto, UpdateCapabilityDto, MapApplicationDto } from './dto/create-capability.dto';

@Injectable()
export class CapabilitiesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCapabilityDto) {
    return this.prisma.capabilityNode.create({
      data: {
        ...dto,
        tenant_id: tenantId,
      } as any,
    });
  }

  async findAll(tenantId?: string) {
    const where = tenantId ? { tenant_id: tenantId } : {};
    return this.prisma.capabilityNode.findMany({
      where,
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
  }

  async getTree(tenantId?: string) {
    const where = tenantId ? { tenant_id: tenantId } : {};
    const allNodes = await this.prisma.capabilityNode.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    const nodeMap = new Map();
    const roots: any[] = [];

    allNodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    allNodes.forEach(node => {
      const nodeWithChildren = nodeMap.get(node.id);
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(nodeWithChildren);
      } else {
        roots.push(nodeWithChildren);
      }
    });

    return roots;
  }

  async findOne(id: string) {
    const node = await this.prisma.capabilityNode.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        applications: {
          include: {
            application: true
          }
        }
      }
    });

    if (!node) throw new NotFoundException('Capability not found');
    return node;
  }

  async update(id: string, dto: UpdateCapabilityDto) {
    return this.prisma.capabilityNode.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.capabilityNode.delete({
      where: { id },
    });
  }

  async mapApplication(capabilityId: string, dto: MapApplicationDto) {
    return this.prisma.applicationCapability.upsert({
      where: {
        tenant_id_application_id_capability_id: {
          tenant_id: (this.prisma as any).request.tenantId,
          application_id: dto.application_id,
          capability_id: capabilityId,
        }
      },
      update: {
        support_level: dto.support_level,
      },
      create: {
        application_id: dto.application_id,
        capability_id: capabilityId,
        support_level: dto.support_level,
        tenant_id: (this.prisma as any).request.tenantId,
      }
    });
  }

  async unmapApplication(capabilityId: string, applicationId: string) {
    return this.prisma.applicationCapability.delete({
      where: {
        tenant_id_application_id_capability_id: {
          tenant_id: (this.prisma as any).request.tenantId,
          application_id: applicationId,
          capability_id: capabilityId,
        }
      }
    });
  }
}
