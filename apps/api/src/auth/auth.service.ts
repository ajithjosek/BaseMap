import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, firstName, lastName, tenantId } = data;

    let actualTenantId = tenantId;
    if (tenantId && !this.isValidUuid(tenantId)) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      actualTenantId = tenant.id;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenant_id_email: {
          tenant_id: actualTenantId,
          email,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        tenant_id: actualTenantId,
      },
    });

    return this.login(user);
  }

  async validateUser(email: string, pass: string, tenantId: string): Promise<any> {
    let actualTenantId = tenantId;
    
    // Resolve slug to UUID if necessary
    if (tenantId && !this.isValidUuid(tenantId)) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException(`Tenant '${tenantId}' not found. Please run the seed to create tenants.`);
      }
      actualTenantId = tenant.id;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenant_id_email: {
          tenant_id: actualTenantId,
          email,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found for tenant '${tenantId}'`);
    }

    if (user && user.password_hash && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  private isValidUuid(id: string) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
  }

  async login(user: any) {
    const payload: JwtPayload = { email: user.email, sub: user.id, tenantId: user.tenant_id };
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refreshSecret',
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refreshSecret',
      });
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException();

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
