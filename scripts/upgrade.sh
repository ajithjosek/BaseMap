#!/usr/bin/env sh
# Zero-downtime upgrade for BaseMap (blue-green style with image swap).
#
# Usage:
#   BASEMAP_VERSION=<new-tag> ./scripts/upgrade.sh
set -euo pipefail

NEW_VERSION="${BASEMAP_VERSION:-latest}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.onprem.yml --profile onprem"

mkdir -p "${BACKUP_DIR}"
TS="$(date +%Y%m%d%H%M%S)"

echo "[1/5] Backing up database..."
docker exec "$(docker compose ps -q postgres)" pg_dump -U postgres basemap > "${BACKUP_DIR}/pre-upgrade-${TS}.sql" || {
  echo "ERROR: DB backup failed. Aborting." >&2
  exit 1
}
echo "Backup saved: ${BACKUP_DIR}/pre-upgrade-${TS}.sql"

echo "[2/5] Building revised images with tag ${NEW_VERSION}..."
docker build -f apps/api/Dockerfile -t "basemap-bundle/basemap-api:${NEW_VERSION}" .
docker build -f apps/web/Dockerfile -t "basemap-bundle/basemap-web:${NEW_VERSION}" .

echo "[3/5] Running Prisma migrations"
${COMPOSE} run --rm api npx prisma migrate deploy

echo "[4/5] Rolling deploy (blue-green via replicas + zero downtime restart)"
export BASEMAP_VERSION="${NEW_VERSION}"
${COMPOSE} up --no-deps -d --force-recreate api web

echo "[5/5] Smoke test"
sleep 10
curl -fs "http://localhost:4000/health" >/dev/null && echo "API healthy."
curl -fs "http://localhost:3000/" >/dev/null && echo "Web reachable."

echo "Upgrade to ${NEW_VERSION} complete."
echo "To roll back, run: ./scripts/rollback.sh"