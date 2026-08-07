import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const C4_LEVELS = ['level1', 'level2', 'level3', 'level4'];

@Injectable()
export class C4DiagramsService {
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private requireTenant(tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Tenant context required');
    return tenantId;
  }

  async create(tenantId: string | undefined, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    if (!dto?.name) throw new BadRequestException('name is required');
    const level = dto.level && C4_LEVELS.includes(dto.level) ? dto.level : 'level1';
    const diagram = await this.db.c4Diagram.create({
      data: {
        tenant_id: tenant,
        name: dto.name,
        level,
        canvas_data: dto.canvas_data ?? {},
        created_by: actor?.userId,
      },
    });
    return { diagram };
  }

  async list(tenantId: string | undefined, level?: string) {
    const tenant = this.requireTenant(tenantId);
    const diagrams = await this.db.c4Diagram.findMany({
      where: {
        tenant_id: tenant,
        ...(level && C4_LEVELS.includes(level) ? { level } : {}),
      },
      orderBy: { updated_at: 'desc' },
      include: {
        versions: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });
    return { diagrams };
  }

  async get(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const diagram = await this.db.c4Diagram.findFirst({ where: { id, tenant_id: tenant } });
    if (!diagram) throw new NotFoundException('Diagram not found');
    return { diagram };
  }

  /**
   * 37.6 Save canvas content as a new immutable snapshot, then bump the
   * diagram's current canvas_data. Keep the last N versions.
   */
  async save(tenantId: string | undefined, id: string, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    const diagram = await this.db.c4Diagram.findFirst({ where: { id, tenant_id: tenant } });
    if (!diagram) throw new NotFoundException('Diagram not found');
    if (dto?.canvas_data === undefined) {
      throw new BadRequestException('canvas_data is required');
    }

    await this.db.c4DiagramVersion.create({
      data: {
        diagram_id: id,
        snapshot: diagram.canvas_data ?? {},
        comment: dto.comment,
        created_by: actor?.userId,
      },
    });

    await this.db.c4Diagram.update({
      where: { id },
      data: {
        canvas_data: dto.canvas_data,
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.level && C4_LEVELS.includes(dto.level) ? { level: dto.level } : {}),
      },
    });

    const total = await this.db.c4DiagramVersion.count({ where: { diagram_id: id } });
    if (total > 50) {
      const stale = await this.db.c4DiagramVersion.findMany({
        where: { diagram_id: id },
        orderBy: { created_at: 'asc' },
        skip: 0,
        take: total - 50,
        select: { id: true },
      });
      if (stale.length) {
        await this.db.c4DiagramVersion.deleteMany({
          where: { id: { in: stale.map((s: any) => s.id) } },
        });
      }
    }

    return this.get(tenantId, id);
  }

  async versions(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const diagram = await this.db.c4Diagram.findFirst({ where: { id, tenant_id: tenant } });
    if (!diagram) throw new NotFoundException('Diagram not found');
    const versions = await this.db.c4DiagramVersion.findMany({
      where: { diagram_id: id },
      orderBy: { created_at: 'desc' },
    });
    return { versions };
  }

  /** Restore a past snapshot back onto the diagram as the working canvas. */
  async restore(tenantId: string | undefined, diagramId: string, versionId: string) {
    const tenant = this.requireTenant(tenantId);
    const diagram = await this.db.c4Diagram.findFirst({
      where: { id: diagramId, tenant_id: tenant },
    });
    if (!diagram) throw new NotFoundException('Diagram not found');
    const version = await this.db.c4DiagramVersion.findFirst({
      where: { id: versionId, diagram_id: diagramId },
    });
    if (!version) throw new NotFoundException('Version not found');

    await this.db.c4Diagram.update({
      where: { id: diagramId },
      data: { canvas_data: version.snapshot },
    });
    return this.get(tenantId, diagramId);
  }

  async remove(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const diagram = await this.db.c4Diagram.findFirst({ where: { id, tenant_id: tenant } });
    if (!diagram) throw new NotFoundException('Diagram not found');
    await this.db.c4DiagramVersion.deleteMany({ where: { diagram_id: id } });
    await this.db.c4Diagram.delete({ where: { id } });
    return { deleted: true };
  }
}