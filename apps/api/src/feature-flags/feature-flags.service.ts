import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  advanced_analytics: false,
  ai_recommendations: false,
  graph_view: true,
  custom_reports: false,
  audit_logs: true,
};

@Injectable()
export class FeatureFlagsService {
  private db: any;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.db = this.prisma as any;
  }

  private cacheKey(tenantId: string) {
    return `feature_flags:${tenantId}`;
  }

  /** Merges tenant-level flags over defaults and short-circuit if disabled in env. */
  async getFlags(tenantId: string): Promise<Record<string, boolean>> {
    const cached = await this.cacheManager.get<Record<string, boolean>>(
      this.cacheKey(tenantId),
    );
    if (cached) return cached;

    const tenant = await this.db.tenant.findUnique({ where: { id: tenantId } });
    const tenantFlags = tenant?.settings?.feature_flags || {};

    const merged: Record<string, boolean> = {
      ...DEFAULT_FEATURE_FLAGS,
      ...tenantFlags,
    };

    await this.cacheManager.set(this.cacheKey(tenantId), merged, 300_000);
    return merged;
  }

  async getFlag(tenantId: string, key: string): Promise<boolean> {
    const flags = await this.getFlags(tenantId);
    return Boolean(flags[key]);
  }

  async getFlagValue(tenantId: string, key: string, defaultValue = false) {
    const flags = await this.getFlags(tenantId);
    return flags[key] ?? defaultValue;
  }

  async setFlag(tenantId: string, key: string, value: boolean) {
    const tenant = await this.db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    const settings = tenant.settings || {};
    settings.feature_flags = {
      ...(settings.feature_flags || {}),
      [key]: value,
    };

    const updated = await this.db.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
    await this.cacheManager.del(this.cacheKey(tenantId));
    return updated.settings.feature_flags;
  }

  async setFlags(tenantId: string, flags: Record<string, boolean>) {
    const tenant = await this.db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    const settings = tenant.settings || {};
    settings.feature_flags = {
      ...(settings.feature_flags || {}),
      ...flags,
    };

    const updated = await this.db.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
    await this.cacheManager.del(this.cacheKey(tenantId));
    return updated.settings.feature_flags;
  }
}
