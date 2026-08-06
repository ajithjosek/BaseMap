import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const PLAN_DEFAULTS: Record<string, number> = {
  starter: 100,
  professional: 500,
  enterprise: 2000,
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private buckets = new Map<string, { tokens: number; last: number }>();

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only rate-limit API routes, skip auth, health, and static assets
    const skip = /^\/(auth|health|metrics|graphql|assets|_next)/.test(req.path);
    if (skip) {
      return next();
    }

    const tenantId = (req as any).tenantId as string | undefined;
    const quota = await this.resolveQuota(tenantId);

    const key = tenantId || `ip:${req.ip}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    let tokens: number;
    let last: number;
    if (bucket) {
      // Refill tokens based on elapsed time (1 request / 60s per unit)
      const refillRate = quota / 60; // tokens per second
      const elapsed = (now - bucket.last) / 1000;
      tokens = Math.min(quota, bucket.tokens + elapsed * refillRate);
      last = now;
    } else {
      tokens = quota;
      last = now;
    }

    const remaining = Math.floor(tokens);
    const retryAfter = Math.max(
      1,
      Math.ceil((quota - remaining) / (quota / 60)),
    );

    res.setHeader('X-RateLimit-Limit', String(quota));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(now / 1000) + 60));

    if (remaining <= 0) {
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.buckets.set(key, { tokens: remaining - 1, last });

    // Bound memory: prune stale entries occasionally
    if (this.buckets.size > 10000) {
      for (const [k, v] of this.buckets) {
        if (now - v.last > 60_000) this.buckets.delete(k);
      }
    }

    next();
  }

  private async resolveQuota(tenantId?: string): Promise<number> {
    if (!tenantId) return 100;
    let plan = 'starter';
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, settings: true },
      });
      plan = tenant?.plan || 'starter';
      const settings = tenant?.settings as any;
      const custom = settings?.quotas?.requests_per_minute;
      if (custom) return Number(custom);
    } catch {
      // fall through to default
    }
    return PLAN_DEFAULTS[plan] || 100;
  }
}
