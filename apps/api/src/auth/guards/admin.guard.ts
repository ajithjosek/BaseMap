import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // For the platform scope, a tenant is identified via header; for super-admin
    // tenant-management operations we consider membership of the tenant's "Admin" role.
    const tenantId = (request as any).tenantId || user.tenantId;
    if (!tenantId) return false;

    const role = await this.prisma.role.findUnique({
      where: { tenant_id_name: { tenant_id: tenantId, name: 'Admin' } },
    });

    if (!role) {
      // If no explicit Admin role exists, fall back to seed super admin check
      const seeded = await this.prisma.user.findUnique({
        where: { id: user.userId },
      });
      if (seeded?.email && seeded.email.includes('admin')) return true;
      throw new ForbiddenException('Admin role required');
    }

    const userRole = await this.prisma.userRole.findFirst({
      where: { user_id: user.userId, role_id: role.id },
    });

    if (!userRole) throw new ForbiddenException('Admin role required');
    return true;
  }
}