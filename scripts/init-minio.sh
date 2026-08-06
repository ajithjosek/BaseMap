#!/usr/bin/env sh
# Initializes MinIO buckets for BaseMap. Run against the on-prem/offline
# compose stack after MinIO is healthy.
#
#   docker compose --profile onprem up -d minio
#   ./scripts/init-minio.sh
set -euo pipefail

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"

# Wait for MinIO to be ready
echo "Waiting for MinIO at ${MINIO_ENDPOINT}..."
for i in $(seq 1 30); do
  if curl -fs "${MINIO_ENDPOINT}/minio/health/live" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: MinIO did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done
echo "MinIO is ready."

# Configure mc alias
mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null

for bucket in exports imports backups basemap-assets; do
  if ! mc stat "local/${bucket}" >/dev/null 2>&1; then
    echo "Creating bucket '${bucket}'..."
    mc mb "local/${bucket}"
  else
    echo "Bucket '${bucket}' already exists."
  fi
done

echo "MinIO initialization complete."