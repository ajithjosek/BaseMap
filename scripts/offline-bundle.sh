#!/usr/bin/env sh
# Builds a Docker image bundle for air-gapped / offline deployment.
#
# On a networked host:
#   1. docker compose build api web
#   2. ./scripts/offline-bundle.sh
# Copy the produced ./bundle directory to the offline host, then run:
#   3. docker compose -f docker-compose.yml -f docker-compose.offline.yml --profile offline up -d
set -euo pipefail

BUNDLE_DIR="${BUNDLE_DIR:-./bundle}"
BASEMAP_VERSION="${BASEMAP_VERSION:-latest}"

# Source images (must exist locally, tagged by create-compose or built here)
IMAGES=(
  "postgres:16-alpine"
  "redis:7-alpine"
  "docker.elastic.co/elasticsearch/elasticsearch:8.12.0"
  "neo4j:5"
  "minio/minio:latest"
)

# Build app images if not present
echo "Building application images..."
docker build -f apps/api/Dockerfile -t "basemap-bundle/basemap-api:${BASEMAP_VERSION}" .
docker build -f apps/web/Dockerfile -t "basemap-bundle/basemap-web:${BASEMAP_VERSION}" .

mkdir -p "${BUNDLE_DIR}/images"

echo "Saving base service images with loader tags..."
for img in "${IMAGES[@]}"; do
  local_name="basemap-bundle/$(echo "${img}" | tr '/' '_' | sed 's/:/-/')"
  docker tag "${img}" "${local_name}" 2>/dev/null || echo "skip tag: ${img}"
done

echo "Saving all images to tar archives..."
# Save app images
docker save -o "${BUNDLE_DIR}/images/basemap-api.tar" "basemap-bundle/basemap-api:${BASEMAP_VERSION}"
docker save -o "${BUNDLE_DIR}/images/basemap-web.tar" "basemap-bundle/basemap-web:${BASEMAP_VERSION}"

# Save base images under expected offline names
docker save -o "${BUNDLE_DIR}/images/postgres.tar" basemap-bundle/postgres_16-alpine
docker save -o "${BUNDLE_DIR}/images/redis.tar" basemap-bundle/redis_7-alpine
docker save -o "${BUNDLE_DIR}/images/elasticsearch.tar" basemap-bundle/docker.elastic.co_elasticsearch_elasticsearch_8.12.0
docker save -o "${BUNDLE_DIR}/images/neo4j.tar" basemap-bundle/neo4j_5
docker save -o "${BUNDLE_DIR}/images/minio.tar" basemap-bundle/minio_minio-latest

echo "Copying compose files and migrations..."
cp docker-compose.yml docker-compose.offline.yml "${BUNDLE_DIR}/"
cp -r apps/api/prisma "${BUNDLE_DIR}/migrations" 2>/dev/null || true

echo "Bundle created at ${BUNDLE_DIR}"
echo "On the offline host, run:"
echo "  for f in bundle/images/*.tar; do docker load -i \"\$f\"; done"
echo "  docker compose -f docker-compose.yml -f docker-compose.offline.yml --profile offline up -d"