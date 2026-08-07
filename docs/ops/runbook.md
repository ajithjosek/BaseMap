# Operations Runbook

**Sprint 39.6 — Deployment, operations and incident response**

Companion to the [On-premise installation](on-premise/installation.md), [backup/restore](on-premise/backup-restore.md), [upgrade](on-premise/upgrade.md) and [troubleshooting](on-premise/troubleshooting.md) guides.

## Deploy

### API

```bash
cd apps/api
npm ci
npx prisma migrate deploy   # the ONLY safe migration command in prod
npx prisma generate         # refresh the Prisma client to current schema
npm run build               # nest build
node dist/src/main.js       # or your process manager / container start
```

> **Important:** the monorepo ships a stale root-level Prisma client. Always run `prisma migrate deploy` + `prisma generate` from `apps/api` at deploy time or newer models will be missing at runtime.

### Web

```bash
cd apps/web
npm ci
npm run build        # next build (Turbopack)
# serve built .next via Node/Next or static hosting + reverse proxy
```

## Migrations first, then code

New models require the migration to be applied before the API reads them. Order your deploy:

1. `npx prisma migrate deploy`
2. `npx prisma generate`
3. Build & restart the API
4. Build & deploy the web app

## Rollback

**App (code):** revert the commit, rebuild, redeploy. Because we deploy-migrations-separately, code and schema are reversible independently.

**Schema:** if a `migrate deploy` has not been applied by other environments yet:

```bash
cd apps/api
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

Prefer forward-fix migrations over destructive rollbacks. Long-running migrations should use `prisma migrate diff` to generate only the additive SQL.

## Backup / restore

- Continuous Postgres logical and file backups per `on-premise/backup-restore.md`.
- Object storage (S3/MinIO) for imported/exported files.
- Weekly restore test; quarterly full DR drill.

## Scale

- **API:** horizontally scalable behind a load balancer (stateless). Same for web.
- **Redis:** required for caching and rate-limit buckets — run as managed service or replica cluster.
- **Queue:** BullMQ workers on Redis for import/export jobs; scale workers independently.
- **Database:** add read replicas before tuning queries; monitor connection pool.

## Incident response

Follow `docs/security/incident-response-plan.md`. Quick map:

| Signal | Likely | First action |
|--------|--------|--------------|
| `429`s everywhere | rate limit | confirm limits per plan; check custom quota |
| 5xx API | code or DB | check `migrate deploy` ran; verify Redis up |
| Missing models at runtime | stale Prisma client | run `npx prisma generate` in apps/api |
| Redis down | cache/queue stale reads | failover; memory fallback active for rate limit |
| Slow graphs/reports | query build-up | turn on `pg_stat_statements`; the k6 suite reproduces it |

## Scaling

- Trigger scaling on API CPU > 70% sustained or p95 latency breaching the k6 threshold.
- Prefer scaling API/web first (cheap), then read replicas, then cache top-off.

## Monitoring checklist

- API health endpoints, Redis latency, Postgres connections, job-queue depth, error rates.
- Baseline: the Sprint 39 load thresholds (`p95 < 2000ms`, error < 5%) — run `tests/load/k6-sprint39-hardening.js` as a regression gate.