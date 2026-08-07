# BaseMap On-Premise Installation

Guides installing BaseMap in your own environment using Docker Compose or an
offline bundle.

## 1. Prerequisites

- Docker Engine 24+ and Docker Compose v2
- 8 vCPU / 16 GB RAM (recommended), 100 GB disk
- DNS names for `api` and `web` (optional but recommended)
- Outbound egress for image pulls (first install) or an offline bundle

## 2. Components

| Service | Purpose |
|---------|---------|
| `api`    | Backend (NestJS) on port 4001 |
| `web`    | Frontend (Next.js) on port 3000 |
| `postgres` | Primary database (Prisma) |
| `redis`  | Cache / rate-limiting / BullMQ |
| `es`     | Elasticsearch (search/analytics) |
| `neo4j`  | Graph (C2A heatmap / dependencies) |
| `minio`  | S3-compatible object storage (exports/imports/backups) |

## 3. Quick Start (Compose)

```bash
# 1. Configure environment
cp .env.production.example .env.production
# 2. Start the stack
docker compose -f docker-compose.yml -f docker-compose.onprem.yml --env-file .env.production up -d
# 3. Apply database schema
docker compose exec api npx prisma migrate deploy
# 4. Seed base data
docker compose exec api npm run prisma:seed
# 5. Verify health
docker compose --env-file .env.production ps
```

## 4. Key Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection (TLS required) | `postgresql://user:pass@postgres:5432/basemap?sslmode=require` |
| `REDIS_URL` | Redis connection | `redis://redis:6379` |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | Graph DB | `neo4j://neo4j:7687` |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Object storage | `minio:9000` |
| `JWT_SECRET` | Signing secret (>= 32 chars, random) | |
| `APP_BASE_URL` | Public base URL | `https://basemap.example.com` |
| `STORAGE_PROVIDER` | `local` / `minio` / `s3` | `minio` |

> **Security:** never commit real values; use a vault or deploy-time injection.
> Set `DATABASE_URL` with `sslmode=require`.

## 5. Verify

- Health check: `curl /health` returns `ok` from the `api`.
- Log in at `/login` with the seeded admin.
- Confirm MinIO buckets (`exports`, `imports`, `backups`) were created on startup.

## 6. Offline (air-gapped)

```bash
# On an internet-connected machine, bundle:
./scripts/offline-bundle.sh
# Transfer <bundle.tar.gz> + install locally:
tar -xzf basemap-offline-<version>.tar.gz
docker compose -f docker-compose.offline.yml up -d
```

See `backup-restore.md` and `upgrade.md` for operations.