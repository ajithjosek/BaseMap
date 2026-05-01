import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { job_title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user_roles: {
            include: {
              role: true,
              business_unit: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        user_roles: {
          include: {
            role: true,
            business_unit: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(tenantId: string, dto: any) {
    const existing = await this.prisma.user.findFirst({
      where: { tenant_id: tenantId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    return this.prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        job_title: dto.job_title,
        department: dto.department,
        is_active: dto.is_active ?? true,
      },
      include: {
        user_roles: {
          include: {
            role: true,
            business_unit: true,
          },
        },
      },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.job_title !== undefined) data.job_title = dto.job_title;
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.password) data.password_hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        user_roles: {
          include: {
            role: true,
            business_unit: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.user.delete({ where: { id } });
  }

  async assignRole(userId: string, tenantId: string, dto: { roleId: string; businessUnitId: string }) {
    await this.findOne(userId, tenantId);

    return this.prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: dto.roleId,
        business_unit_id: dto.businessUnitId,
      },
      include: {
        role: true,
        business_unit: true,
      },
    });
  }

  async removeRole(userId: string, tenantId: string, roleId: string, businessUnitId: string) {
    await this.findOne(userId, tenantId);

    return this.prisma.userRole.delete({
      where: {
        user_id_role_id_business_unit_id: {
          user_id: userId,
          role_id: roleId,
          business_unit_id: businessUnitId,
        },
      },
    });
  }

  async getRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: {
        OR: [{ tenant_id: tenantId }, { tenant_id: null }],
      },
    });
  }

  async getBusinessUnits(tenantId: string) {
    return this.prisma.businessUnit.findMany({
      where: { tenant_id: tenantId },
    });
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { preferences },
      select: {
        id: true,
        email: true,
        preferences: true,
      },
    });
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.preferences;
  }
}
