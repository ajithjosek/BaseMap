import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCapabilityDto, UpdateCapabilityDto, MapApplicationDto } from './dto/create-capability.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class CapabilitiesService {
  constructor(private prisma: PrismaService) {}

  private async checkCircularAndDepth(tenantId: string, newParentId: string | null | undefined, nodeId: string | null): Promise<number> {
    if (!newParentId) return 1;
    let currentId = newParentId;
    let parentLevel = 1;
    let count = 0;

    while (currentId) {
      count++;
      if (count > 20) throw new BadRequestException('Tree too deep or circular');
      if (currentId === nodeId) {
        throw new BadRequestException('Circular dependency detected');
      }
      const parent = await this.prisma.capabilityNode.findUnique({ where: { id: currentId, tenant_id: tenantId } });
      if (!parent) throw new BadRequestException('Parent not found');
      
      currentId = parent.parent_id || '';
      if (currentId) parentLevel++;
    }
    
    const newLevel = parentLevel + 1;
    if (newLevel > 4) {
      throw new BadRequestException('Maximum hierarchy depth of 4 levels exceeded');
    }
    return newLevel;
  }

  private async getDescendantMaxDepth(tenantId: string, nodeId: string): Promise<number> {
    const children = await this.prisma.capabilityNode.findMany({
      where: { parent_id: nodeId, tenant_id: tenantId }
    });
    if (children.length === 0) return 0;
    
    let max = 0;
    for (const child of children) {
      const depth = await this.getDescendantMaxDepth(tenantId, child.id);
      if (depth > max) max = depth;
    }
    return max + 1;
  }

  private async updateDescendantsLevels(tenantId: string, nodeId: string, newLevel: number) {
    const children = await this.prisma.capabilityNode.findMany({
      where: { parent_id: nodeId, tenant_id: tenantId }
    });
    for (const child of children) {
      const childLevel = newLevel + 1;
      await this.prisma.capabilityNode.update({
        where: { id: child.id },
        data: { level: childLevel }
      });
      await this.updateDescendantsLevels(tenantId, child.id, childLevel);
    }
  }

  async create(tenantId: string, dto: CreateCapabilityDto) {
    const level = await this.checkCircularAndDepth(tenantId, dto.parent_id, null);
    
    return this.prisma.capabilityNode.create({
      data: {
        ...dto,
        level,
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

  async update(id: string, dto: UpdateCapabilityDto, tenantId: string) {
    const existing = await this.prisma.capabilityNode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Capability not found');

    if (existing.is_locked && dto.is_locked === undefined) {
      throw new ForbiddenException('Cannot edit a locked capability');
    }

    let level = existing.level;
    if (dto.parent_id !== undefined && dto.parent_id !== existing.parent_id) {
      const newLevel = await this.checkCircularAndDepth(tenantId, dto.parent_id, id);
      const descendantDepth = await this.getDescendantMaxDepth(tenantId, id);
      if (newLevel + descendantDepth > 4) {
        throw new BadRequestException('Moving this node exceeds the maximum depth of 4 for some of its descendants');
      }
      level = newLevel;
    }

    const updated = await this.prisma.capabilityNode.update({
      where: { id },
      data: {
        ...dto,
        level,
        ...(dto.parent_id === null ? { parent_id: null } : {})
      } as any,
    });

    if (level !== existing.level) {
      await this.updateDescendantsLevels(tenantId, id, level);
    }

    return updated;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.capabilityNode.findUnique({ where: { id, tenant_id: tenantId } });
    if (!existing) throw new NotFoundException('Capability not found');
    if (existing.is_locked) throw new ForbiddenException('Cannot delete a locked capability');

    // Cascading delete is not automatic in schema without parent relation onDelete: Cascade?
    // Wait, let's check schema: `children CapabilityNode[] @relation("CapToCap")`. 
    // It does not have onDelete: Cascade. We need to implement bulkDelete recursively or linearly.
    const nodesToDelete = await this.getDescendantIds(tenantId, id);
    nodesToDelete.push(id);

    // Delete from bottom up or use Prisma deleteMany with in
    await this.prisma.capabilityNode.deleteMany({
      where: {
        id: { in: nodesToDelete },
        tenant_id: tenantId
      }
    });

    return { success: true, count: nodesToDelete.length };
  }

  private async getDescendantIds(tenantId: string, nodeId: string): Promise<string[]> {
    const children = await this.prisma.capabilityNode.findMany({
      where: { parent_id: nodeId, tenant_id: tenantId },
      select: { id: true }
    });
    
    let ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids = ids.concat(await this.getDescendantIds(tenantId, child.id));
    }
    return ids;
  }

  async importFromCsv(tenantId: string, csvContent: string) {
    const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as any[];
    
    let imported = 0;
    // Format expected: Level 1, Level 2, Level 3, Level 4, Description
    for (const record of records) {
      let parentId: string | null = null;
      let level = 1;
      
      for (let i = 1; i <= 4; i++) {
        const name = record[`Level ${i}`]?.trim();
        if (!name) break;

        let node = await this.prisma.capabilityNode.findFirst({
          where: {
            tenant_id: tenantId,
            name,
            parent_id: parentId,
            level
          }
        });

        if (!node) {
          node = await this.prisma.capabilityNode.create({
            data: {
              tenant_id: tenantId,
              name,
              level,
              parent_id: parentId,
              description: i === 4 || !record[`Level ${i+1}`] ? record['Description'] : undefined,
              strategic_importance: 'Medium'
            }
          });
          imported++;
        }
        
        parentId = node.id;
        level++;
      }
    }
    return { success: true, imported };
  }

  async mapApplication(capabilityId: string, dto: MapApplicationDto, tenantId: string, userId: string) {
    const record = await this.prisma.applicationCapability.upsert({
      where: {
        tenant_id_application_id_capability_id: {
          tenant_id: tenantId,
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
        tenant_id: tenantId,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        entity_type: 'ApplicationCapability',
        action: 'CREATE/UPDATE',
        changes: { capabilityId, applicationId: dto.application_id, support_level: dto.support_level } as any,
      }
    });

    return record;
  }

  async unmapApplication(capabilityId: string, applicationId: string, tenantId: string, userId: string) {
    const record = await this.prisma.applicationCapability.delete({
      where: {
        tenant_id_application_id_capability_id: {
          tenant_id: tenantId,
          application_id: applicationId,
          capability_id: capabilityId,
        }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        entity_type: 'ApplicationCapability',
        action: 'DELETE',
        changes: { capabilityId, applicationId } as any,
      }
    });

    return record;
  }
}
