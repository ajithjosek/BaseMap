import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;
    
    // If it's a slug (not a UUID), resolve it
    if (tenantId && !this.isValidUuid(tenantId)) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantId }
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (tenantId) {
      (req as any).tenantId = tenantId;
    }
    
    next();
  }

  private isValidUuid(id: string) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
  }
}
