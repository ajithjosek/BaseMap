# Backup & Restore

## 1. What to back up

| Data | Where | Method |
|------|-------|--------|
| Database | Postgres (`basemap`) | `pg_dump` / physical backup |
| Graph | Neo4j | `neo4j-admin database dump` |
| Object storage | MinIO buckets (`exports`, `imports`, `backups`) | `mc` mirror |
| Elasticsearch indices | search index | re-index from DB (optional) |

## 2. Snapshot the database

```bash
docker compose exec -T postgres pg_dump -U basemap -Fc basemap > backup-$(date +%F).dump
```

Encrypt at rest, e.g.:
```bash
gpg --symmetric --cipher-algo AES256 backup-$(date +%F).dump
```

## 3. Backup the graph + objects

```bash
# Neo4j
docker compose exec neo4j neo4j-admin database dump
# MinIO
mc mirror minio/exports ./backups/minio-exports
mc mirror minio/imports ./backups/minio-imports
```

## 4. Backup retention

- Daily `pg_dump` kept 14 days locally.
- Copy to offsite/S3 for 30 days, monthly for 12 months.

## 5. Restore

1. Stop the application: `docker compose stop api web`
2. Restore Postgres:
   ```bash
   docker compose exec -T postgres pg_restore -U basemap -d basemap --clean restore.dump
   ```
3. Restore Neo4j:
   ```bash
   docker compose exec neo4j neo4j-admin database load basemap --from-path /backups
   ```
4. Restore MinIO objects with `mc mirror`.
5. `docker compose start api web`
6. Run a smoke test: log in, load the dashboard, view an application.

## 6. Restore drill

Run a quarterly restore drill to an isolated Postgres instance and document
time-to-recover (target: < 4 hours, RPO ≤ 24 h based on backup cadence).