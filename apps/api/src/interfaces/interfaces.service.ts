import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterfaceDto, UpdateInterfaceDto } from './dto/create-interface.dto';

@Injectable()
export class InterfacesService {
  constructor(private prisma: PrismaService) {}

  async create(createInterfaceDto: CreateInterfaceDto, userId: string) {
    if (createInterfaceDto.source_application_id && createInterfaceDto.target_application_id) {
      const hasCycle = await this.detectCircularDependency(
        createInterfaceDto.source_application_id,
        createInterfaceDto.target_application_id
      );

      // Warning mechanism
      if (hasCycle) {
        // Since the user requested a warning rather than blocking, we'll append to description or log it.
        // Or we could pass a flag, but for now we'll just allow it with a console warning,
        // or we could throw a specific exception if we want the frontend to confirm.
        // Let's allow it but maybe add a warning flag or log.
        console.warn('Circular dependency detected when linking', createInterfaceDto.source_application_id, 'to', createInterfaceDto.target_application_id);
      }
    }

    const data: any = {
      ...createInterfaceDto,
      created_by: userId,
      updated_by: userId,
    };
    
    return this.prisma.interface.create({
      data,
    });
  }

  async detectCircularDependency(sourceAppId: string, targetAppId: string): Promise<boolean> {
    // If a -> b is requested, we need to check if there is a path from b -> a
    // If so, adding a -> b creates a cycle.
    const visited = new Set<string>();
    const stack = [targetAppId]; // Start from target, look for source

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === sourceAppId) return true; // Found a path back to source

      if (!visited.has(current)) {
        visited.add(current);
        const downstreamEdges = await this.prisma.interface.findMany({
          where: { source_application_id: current }
        });
        
        for (const edge of downstreamEdges) {
          if (edge.target_application_id && !visited.has(edge.target_application_id)) {
            stack.push(edge.target_application_id);
          }
        }
      }
    }
    return false;
  }

  async findAll(query: any, tenantId?: string) {
    const { source_application_id, target_application_id } = query;
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (source_application_id) where.source_application_id = source_application_id;
    if (target_application_id) where.target_application_id = target_application_id;

    return this.prisma.interface.findMany({
      where,
      include: {
        source_application: true,
        target_application: true,
      }
    });
  }

  async findOne(id: string) {
    const intf = await this.prisma.interface.findUnique({
      where: { id },
      include: {
        source_application: true,
        target_application: true,
      }
    });
    if (!intf) throw new NotFoundException('Interface not found');
    return intf;
  }

  async update(id: string, updateInterfaceDto: UpdateInterfaceDto, userId: string) {
    await this.findOne(id);
    return this.prisma.interface.update({
      where: { id },
      data: {
        ...updateInterfaceDto,
        updated_by: userId,
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.interface.delete({
      where: { id }
    });
  }

  async getDependencyGraph(applicationId: string, hops: number) {
    const nodesMap = new Map<string, any>();
    const edgesMap = new Map<string, any>();
    
    // Breadth-first search for upstream and downstream
    await this.traverseGraph(applicationId, hops, 'downstream', nodesMap, edgesMap);
    await this.traverseGraph(applicationId, hops, 'upstream', nodesMap, edgesMap);

    // Basic cycle detection on the fetched graph
    let hasCircularWarning = false;
    for (const node of nodesMap.values()) {
      // Check if there is a path from this node back to itself in the fetched edges
      const visited = new Set<string>();
      const stack = [node.id];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) {
          if (current === node.id) {
             hasCircularWarning = true;
             break;
          }
          continue;
        }
        visited.add(current);
        const children = Array.from(edgesMap.values())
          .filter(e => e.source_application_id === current)
          .map(e => e.target_application_id);
        stack.push(...children);
      }
      if (hasCircularWarning) break;
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
      hasCircularWarning,
    };
  }

  private async traverseGraph(appId: string, maxHops: number, direction: 'upstream' | 'downstream', nodesMap: Map<string, any>, edgesMap: Map<string, any>) {
    const queue: { id: string; currentHop: number }[] = [{ id: appId, currentHop: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, currentHop } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      // Load app details
      if (!nodesMap.has(id)) {
        const app = await this.prisma.application.findUnique({ where: { id } });
        if (app) nodesMap.set(id, app);
      }

      if (currentHop < maxHops) {
        let relations;
        if (direction === 'downstream') {
          // Downstream: app is source
          relations = await this.prisma.interface.findMany({ where: { source_application_id: id } });
        } else {
          // Upstream: app is target
          relations = await this.prisma.interface.findMany({ where: { target_application_id: id } });
        }

        for (const rel of relations) {
          edgesMap.set(rel.id, rel);
          
          const nextAppId = direction === 'downstream' ? rel.target_application_id : rel.source_application_id;
          if (nextAppId && !visited.has(nextAppId)) {
            queue.push({ id: nextAppId, currentHop: currentHop + 1 });
          }
        }
      }
    }
  }
}
