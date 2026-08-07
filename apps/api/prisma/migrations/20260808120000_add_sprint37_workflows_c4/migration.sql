-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "entity_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "config" JSONB DEFAULT '{}',
    "position_x" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "position_y" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "context" JSONB DEFAULT '{}',
    "trace" JSONB DEFAULT '[]',
    "created_by" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c4_diagrams" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "level" VARCHAR(20) NOT NULL DEFAULT 'level1',
    "canvas_data" JSONB DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "c4_diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c4_diagram_versions" (
    "id" TEXT NOT NULL,
    "diagram_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c4_diagram_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflows_tenant_id_entity_type_idx" ON "workflows"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "workflows_tenant_id_is_active_idx" ON "workflows"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "workflow_steps_workflow_id_idx" ON "workflow_steps"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_instances_workflow_id_status_idx" ON "workflow_instances"("workflow_id", "status");

-- CreateIndex
CREATE INDEX "c4_diagrams_tenant_id_idx" ON "c4_diagrams"("tenant_id");

-- CreateIndex
CREATE INDEX "c4_diagram_versions_diagram_id_created_at_idx" ON "c4_diagram_versions"("diagram_id", "created_at");