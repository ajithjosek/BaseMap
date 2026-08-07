-- CreateTable
CREATE TABLE "tech_standards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'proposed',
    "version_range" VARCHAR(100),
    "sunset_date" DATE,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tech_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_standard_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_standard_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capability_kpis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "capability_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capability_kpi_values" (
    "id" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capability_kpi_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tech_standards_tenant_id_idx" ON "tech_standards"("tenant_id");

-- CreateIndex
CREATE INDEX "tech_standards_tenant_id_category_idx" ON "tech_standards"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "tech_standards_tenant_id_status_idx" ON "tech_standards"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tech_standard_categories_tenant_id_name_key" ON "tech_standard_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "tech_standard_categories_tenant_id_idx" ON "tech_standard_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "capability_kpis_tenant_id_idx" ON "capability_kpis"("tenant_id");

-- CreateIndex
CREATE INDEX "capability_kpis_capability_id_idx" ON "capability_kpis"("capability_id");

-- CreateIndex
CREATE INDEX "capability_kpi_values_kpi_id_recorded_at_idx" ON "capability_kpi_values"("kpi_id", "recorded_at");

-- CreateIndex
CREATE INDEX "capability_kpi_values_kpi_id_idx" ON "capability_kpi_values"("kpi_id");