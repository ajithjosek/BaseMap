import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(tenantId: string, createApplicationDto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        ...createApplicationDto,
        tenant_id: tenantId,
      } as any,
    });
  }

  async findAll(query: any, tenantId?: string) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sort,
      lifecycle,
      business_unit_id,
      technology_type,
      risk_min,
      risk_max
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lifecycle) {
      const lifecycles = Array.isArray(lifecycle) ? lifecycle : [lifecycle];
      where.lifecycle_state = { in: lifecycles };
    }

    if (business_unit_id) {
      where.business_unit_id = business_unit_id;
    }

    if (technology_type) {
      where.technology_type = technology_type;
    }

    if (risk_min || risk_max) {
      where.risk_score = {
        gte: risk_min ? Number(risk_min) : undefined,
        lte: risk_max ? Number(risk_max) : undefined,
      };
    }

    let orderBy: any = { name: 'asc' };
    if (sort) {
      const sortFields = sort.split(',').map((s: string) => {
        const [field, order] = s.split(':');
        return { [field]: order || 'asc' };
      });
      orderBy = sortFields;
    }

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy,
        include: {
          business_unit: true,
          owner: true,
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, deleted_at: null },
      include: {
        business_unit: true,
        owner: true,
        costs: true,
        capabilities: {
          include: {
            capability: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    await this.findOne(id);

    return this.prisma.application.update({
      where: { id },
      data: updateApplicationDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.application.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.application.updateMany({
      where: {
        id: { in: ids },
      },
      data: { deleted_at: new Date() },
    });
  }

  async transitionLifecycle(id: string, dto: any, userId: string) {
    const app = await this.findOne(id);
    
    const validTransitions: Record<string, string[]> = {
      'Planning': ['Active', 'Retirement'],
      'Active': ['Maintenance', 'Retirement'],
      'Maintenance': ['Active', 'Retirement'],
      'Retirement': ['Retired', 'Active'],
      'Retired': [],
    };

    if (!validTransitions[app.lifecycle_state].includes(dto.target_state)) {
      throw new Error(`Invalid lifecycle transition from ${app.lifecycle_state} to ${dto.target_state}`);
    }

    const oldState = app.lifecycle_state;
    const newState = dto.target_state;

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        lifecycle_state: dto.target_state,
        lifecycle_changed_at: new Date(),
        lifecycle_changed_by: userId,
        lifecycle_reason: dto.reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenant_id: app.tenant_id,
        entity_type: 'application',
        entity_id: id,
        entity_name: app.name,
        action: 'UPDATE',
        changes: [
          {
            field: 'lifecycle_state',
            old_value: oldState,
            new_value: newState,
            reason: dto.reason,
          },
        ],
        user_id: userId,
      },
    });

    await this.notificationsService.sendLifecycleChangeNotification(
      app.tenant_id,
      userId,
      app.name,
      oldState,
      newState,
    );

    return updatedApp;
  }
}
