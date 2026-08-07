# Troubleshooting

Common operational issues for an on-premise BaseMap deployment.

## 1. Services not starting

Check status and logs:
```bash
docker compose ps
docker compose logs --tail=200 api web postgres redis es neo4j minio
```

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `api` crash-loops | `DATABASE_URL` unreachable | Verify network + creds; `docker compose exec postgres pg_isready` |
| Storage errors | `STORAGE_PROVIDER`/MinIO creds mismatch | Recheck `MINIO_*` variables and bucket creation |
| Neo4j auth errors | wrong `NEO4J_*` | Set matching password; on first boot Neo4j needs auth setup |
| `web` 502 | `api` down or wrong `APP_BASE_URL` | ensure web can reach api host |

## 2. Database connectivity

```bash
docker compose exec postgres pg_isready -U basemap
```
If ready but API says auth failed, confirm `DATABASE_URL` includes correct
user/password and `sslmode=require` is acceptable to your Postgres config.

## 3. Migrations failing

```bash
docker compose exec api npx prisma migrate status
docker compose exec api npx prisma migrate deploy
```
If a migration fails partway, inspect `logs` for the failing statement; restore
the pre-upgrade snapshot (see `upgrade.md`) before retrying.

## 4. Slow or missing search/analytics

- Elasticsearch not populated → check `es` health and indexer job logs.
- High latency → check `redis` is up; rate-limit counters reset correctly.

## 5. Secret/key rotation

After rotating `JWT_SECRET`, `MINIO_SECRET_KEY`, or SSO secrets, restart `api`:
```bash
docker compose restart api
```
Invalidate old sessions by rotating `JWT_SECRET` and redeploying.

## 6. Crash loop recovery

1. `docker compose stop api web`
2. `docker compose restart postgres redis es neo4j minio`
3. Verify each service healthy in `ps`.
4. Start app services and confirm the dashboard loads.

Deployment-critical steps are also documented in `upgrade.md` and the runbook.