import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/** Default retention (days) per entity type, seeded on first read. */
const DEFAULT_RETENTION: Record<string, number> = {
  audit_log: 365,
  notification: 30,
  import_job: 30,
  export_job: 365,
  email_log: 90,
};

/** Physical table + time column used to prune each entity type. */
const PURGE_TARGETS: Record<string, { table: string; column: string }> = {
  audit_log: { table: 'audit_log', column: 'created_at' },
  notification: { table: 'notifications', column: 'created_at' },
  import_job: { table: 'import_jobs', column: 'created_at' },
  export_job: { table: 'export_jobs', column: 'created_at' },
  email_log: { table: 'email_logs', column: 'created_at' },
};

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private async ensureDefaults() {
    const existing = await this.db.retentionPolicy.findMany({
      select: { entity_type: true },
    });
    const have = new Set(existing.map((r: any) => r.entity_type));
    const fresh = Object.entries(DEFAULT_RETENTION)
      .filter(([entity_type]) => !have.has(entity_type))
      .map(([entity_type, retention_days]) => ({ entity_type, retention_days, enabled: true }));

    if (fresh.length) {
      await this.db.retentionPolicy.createMany({ data: fresh });
    }
  }

  async getSettings() {
    await this.ensureDefaults();
    const policies = await this.db.retentionPolicy.findMany({
      orderBy: { entity_type: 'asc' },
    });
    return {
      policies,
      defaults: DEFAULT_RETENTION,
    };
  }

  /** Upsert retention settings provided as an array of policy updates. */
  async updateSettings(dto: any) {
    const updates = Array.isArray(dto?.policies) ? dto.policies : [dto];
    const results: any[] = [];

    for (const p of updates) {
      const type = p.entity_type;
      if (!type) throw new BadRequestException('entity_type is required');
      const days = Number(p.retention_days);
      if (!Number.isFinite(days) || days < 0) {
        throw new BadRequestException(`Invalid retention_days for '${type}'`);
      }
      const result = await this.db.retentionPolicy.upsert({
        where: { entity_type: type },
        update: {
          retention_days: days,
          ...(typeof p.enabled === 'boolean' ? { enabled: p.enabled } : {}),
        },
        create: {
          entity_type: type,
          retention_days: days,
          enabled: p.enabled !== false,
        },
      });
      results.push(result);
    }

    return { updated: results.length, policies: results };
  }

  /**
   * Daily purge: for each enabled policy, delete rows that are older than the
   * configured retention window (based on the entity's `created_at` column).
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpired() {
    this.logger.log('Purging data past retention windows...');
    await this.ensureDefaults();

    const policies = await this.db.retentionPolicy.findMany({
      where: { enabled: true },
    });

    const summary: { entity_type: string; deleted: number }[] = [];
    const now = new Date();

    for (const policy of policies) {
      const target = PURGE_TARGETS[policy.entity_type];
      if (!target) continue;

      const cutoff = new Date(now.getTime() - policy.retention_days * 24 * 60 * 60 * 1000);
      try {
        const result = await this.prisma.$executeRawUnsafe(
          `DELETE FROM "${target.table}" WHERE "${target.column}" < $1::timestamptz`,
          cutoff,
        );
        summary.push({ entity_type: policy.entity_type, deleted: Number(result) });
      } catch (error: any) {
        this.logger.error(
          `Retention purge failed for ${policy.entity_type}: ${error.message}`,
        );
      }
    }

    const total = summary.reduce((sum, s) => sum + s.deleted, 0);
    this.logger.log(`Retention purge finished. Deleted ${total} row(s).`);
    return summary;
  }
}