#!/usr/bin/env sh
# Rolls back BaseMap to a previous version and restores the database backup.
#
# Usage:
#   ./scripts/rollback.sh [backup.sql]
# If no backup file is given, the most recent pre-upgrade backup is used.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${1:-$(ls -1t "${BACKUP_DIR}/pre-upgrade-"*.sql 2>/dev/null | head -n1)}"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: No backup file found. Pass one explicitly: ./scripts/rollback.sh <file>.sql" >&2
  exit 1
fi

# Determine previous version tag from git history (or require explicit BASEMAP_VERSION)
if [ -z "${BASEMAP_VERSION:-}" ]; then
  echo "ERROR: Set BASEMAP_VERSION to the previous release tag to restore the images." >&2
  exit 1
fi

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.onprem.yml --profile onprem"

echo "[1/3] Restoring database from ${BACKUP_FILE}..."
docker exec -i "$(docker compose ps -q postgres)" psql -U postgres basemap < "${BACKUP_FILE}" || {
  echo "ERROR: DB restore failed." >&2
  exit 1
}

echo "[2/3] Redeploying previous images: ${BASEMAP_VERSION}"
export BASEMAP_VERSION="${BASEMAP_VERSION}"
${COMPOSE} up --no-deps -d --force-recreate api web

echo "[3/3] Smoke test"
sleep 10
curl -fs "http://localhost:4000/health" >/dev/null && echo "API healthy."
curl -fs "http://localhost:3000/" >/dev/null && echo "Web reachable."

echo "Rollback to ${BASEMAP_VERSION} complete."