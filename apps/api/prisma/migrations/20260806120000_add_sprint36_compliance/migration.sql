-- CreateTable
CREATE TABLE "access_certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "period" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "due_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "access_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_certification_items" (
    "id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_name" VARCHAR(255),
    "access_level" VARCHAR(50) NOT NULL,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "access_certification_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_certifications_tenant_id_status_idx" ON "access_certifications"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "access_certification_items_certification_id_review_status_idx" ON "access_certification_items"("certification_id", "review_status");

-- CreateIndex
CREATE INDEX "access_certification_items_user_id_idx" ON "access_certification_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_entity_type_key" ON "retention_policies"("entity_type");