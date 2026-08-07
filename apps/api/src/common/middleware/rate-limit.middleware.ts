import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

const PLAN_DEFAULTS: Record<string, number> = {
  starter: 100,
  pro: 300,
  professional: 500,
  enterprise: 2000,
};

/**
 * Sprint 38.9 — token-bucket rate limiting with Redis-backed buckets.
 * Per-tenant quotas are derived from the tenant's plan (or a custom quota in
 * tenant settings). Returns HTTP 429 + Retry-After and X-RateLimit-* headers.
 * Falls back to an in-memory store if Redis is unavailable.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private buckets = new Map<string, { tokens: number; last: number }>();
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    try {
      this.redis = new Redis({
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
    } catch {
      this.redis = null;
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const skip = /^\/(auth|health|metrics|graphql|assets|_next)/.test(req.path);
    if (skip) return next();

    const tenantId = (req as any).tenantId as string | undefined;
    const quota = await this.resolveQuota(tenantId);
    const key = tenantId || `ip:${req.ip}`;
    const now = Date.now();

    const { tokens, last } = await this.readBucket(key, quota, now);
    const remaining = Math.floor(tokens);
    const retryAfter = Math.max(1, Math.ceil((quota - remaining) / Math.max(quota / 60, 1)));

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

    await this.writeBucket(key, { tokens: remaining - 1, last }, Math.max(quota, 60));

    if (this.buckets.size > 10000) {
      for (const [k, v] of this.buckets) {
        if (now - v.last > 60_000) this.buckets.delete(k);
      }
    }

    next();
  }

  /** Read/refill a bucket from Redis (fallback in-memory). */
  private async readBucket(
    key: string,
    quota: number,
    now: number,
  ): Promise<{ tokens: number; last: number }> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(`rl:${key}`);
        if (raw) {
          const { tokens, last } = JSON.parse(raw);
          const refill = quota / 60;
          const elapsed = Math.max(0, (now - last) / 1000);
          return { tokens: Math.min(quota, tokens + elapsed * refill), last: now };
        }
      } catch {
        // fall through to memory
      }
    }
    const bucket = this.buckets.get(key);
    if (bucket) {
      const refill = quota / 60;
      const elapsed = (now - bucket.last) / 1000;
      return { tokens: Math.min(quota, bucket.tokens + elapsed * refill), last: now };
    }
    return { tokens: quota, last: now };
  }

  private async writeBucket(
    key: string,
    bucket: { tokens: number; last: number },
    ttlSeconds: number,
  ) {
    if (this.redis) {
      try {
        await this.redis.set(`rl:${key}`, JSON.stringify(bucket), 'EX', ttlSeconds);
        return;
      } catch {
        // fall through to memory
      }
    }
    this.buckets.set(key, bucket);
  }

  private async resolveQuota(tenantId?: string): Promise<number> {
    if (!tenantId) return PLAN_DEFAULTS.starter;
    let plan = 'starter';
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, settings: true },
      });
      plan = tenant?.plan || 'starter';
      const custom = (tenant?.settings as any)?.quotas?.requests_per_minute;
      if (custom) return Number(custom);
    } catch {
      // fall through to default
    }
    return PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.starter;
  }
}