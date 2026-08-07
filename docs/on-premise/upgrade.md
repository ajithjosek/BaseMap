# Upgrade

Zero-downtime upgrade and rollback for BaseMap on-premise deployments.

## 1. Preflight

- Confirm target version release notes for breaking changes.
- Take a backup (see `backup-restore.md`).
- Verify sufficient disk and that the previous version is designed to roll back.

## 2. Upgrade (blue-green)

```bash
./scripts/upgrade.sh <new_tag>
```

The script performs:
1. Database backup.
2. Pull new images (`docker compose pull`).
3. Run schema migrations: `docker compose exec api npx prisma migrate deploy`.
4. Deploy new version and run smoke tests (health, login, dashboard).
5. On success, orphans the previous version for manual rollback.

> **Before** running `migrate deploy`, snapshot the DB — migrations can be
> irreversible. In emergencies, `prisma migrate resolve` can mark a migration
> as applied without executing it (do not use unless you understand it).

## 3. Verify after upgrade

- `curl /health` → `ok`.
- Run the E2E smoke set (login → create app → capability → report → export).
- Confirm audit log shows the deployment (action `UPGRADE`).

## 4. Rollback

```bash
./scripts/rollback.sh <previous_tag>
```

1. Restore the DB backup taken before the upgrade.
2. Deploy the previous version's images.
3. Verify database schema is compatible (migrate-rollback / restore).
4. Run smoke tests; re-enable traffic.

## 5. Fast-forward vs non-fast-forward migrations

- Prefer **additive** migrations (non-breaking, backward compatible) to allow
  blue-green without downtime.
- Always keep the previous release images locally until the upgrade is proven.

## 6. Communication

- Notify tenants of maintenance windows for broad or allowed_down-time upgrades.
- Document the deployed version in the release log.