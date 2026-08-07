# On-Prem Deployment & Sign-off

**Sprint 40.2 — Helm / Docker Compose deploy, backup test, customer sign-off**

## Docker Compose (recommended for single-node / pilot)

```bash
# Full stack: postgres, redis, api, web, minio, elasticsearch, neo4j
docker compose up -d

# On-prem profile (MinIO object storage, tighter port exposure):
docker compose -f docker-compose.yml -f docker-compose.onprem.yml --profile onprem up -d

# Air-gapped environments:
docker compose -f docker-compose.yml -f docker-compose.offline.yml up -d
```

Service map (from `docker-compose.onprem.yml`):

| Service | Port (bound) | Purpose |
|---------|--------------|---------|
| postgres | 127.0.0.1:5432 | primary store |
| redis | * | cache + rate-limit buckets + BullMQ |
| api | 127.0.0.1:4000 | NestJS REST/GraphQL |
| web | 127.0.0.1:3000 | Next.js UI |
| minio | * | S3-compatible object storage (on-prem) |
| elasticsearch | 127.0.0.1:9200 | search |
| neo4j | 127.0.0.1:7474/:7687 | graph |

## Migrations & Prisma (critical)

```bash
docker compose exec api sh -c "npx prisma migrate deploy && npx prisma generate"
```

> The API reads schema via the generated Prisma client. Applying the migration **before** the new build runs is mandatory (see `docs/ops/runbook.md`).

## Helm (Kubernetes)

```bash
helm upgrade --install basemap ./charts/basemap --namespace basemap --create-namespace \
  --set image.api.repository=... --set image.web.repository=... \
  --set ingress.host=basemap.example.com
```

Chart metadata already targets `1.0.0`/`appVersion 1.0.0` (`charts/basemap/Chart.yaml`). Customize via `values.yaml`.

## Backup test (run before sign-off)

1. `docker compose exec postgres pg_dump -U <user> basemap | gzip > /tmp/basemap-backup.sql.gz`
2. Restore into a scratch DB and run a smoke query (e.g. `SELECT count(*) FROM applications`).
3. Object storage: verify MinIO bucket contents are replicable (import/export files).
4. Record the restore time and sign off.

> Detailed procedures: `docs/on-premise/backup-restore.md`, `docs/on-premise/upgrade.md`, `docs/on-premise/troubleshooting.md`.

## Sign-off checklist

- [ ] `docker compose up` healthy (all containers `Up`, no restart loops)
- [ ] `/api/docs` reachable (Swagger), login works
- [ ] Migrations applied via `migrate deploy` (not `prisma migrate dev`)
- [ ] Rate-limit headers present on API responses
- [ ] Backup + restore test passed
- [ ] Version label shown as v1.0.0
- [ ] Customer signs: date + name