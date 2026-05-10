# Data Model Design

## Overview
This section outlines the **core data model** for the EAM platform. The schema is designed for PostgreSQL and supports multi-tenancy, audit logging, and extensibility.

---

## 1. Core Entity Relationship Diagram

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Tenant    │──────│   Organization    │──────│   BusinessUnit   │
│  (Multi-    │ 1:N  │  (Top-level org) │ 1:N  │                  │
│   tenant)   │      └──────────────────┘      └────────┬─────────┘
└─────────────┘                                        │
                                                      │ 1:N
┌────────────────────────────────────────────────────┴──────────────────┐
│                         Application                                    │
│  id, name, description, vendor, version, lifecycle_state, owner_id,   │
│  business_unit_id, technology_type, eol_date, risk_score,            │
│  cloud_readiness, deployment_model, created_at, updated_at           │
└────────────────────────────────────┬─────────────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
1:N  │                              │                              │ 1:N
     │                              │                              │
┌────▼──────────────┐  ┌───────────▼──────────────┐  ┌───────────▼──────────┐
│ ApplicationCost   │  │ApplicationCapability      │  │ ApplicationComponent  │
│ (TCO tracking)    │  │ (many-to-many link)      │  │ (tech components)    │
└───────────────────┘  └──────────────────────────┘  └────────────────────┘

┌───────────────────┐      ┌─────────────────────────────────────────┐
│  Capability       │──────│  CapabilityNode                         │
│  (Tree root)      │ 1:N  │  id, parent_id, name, description,     │
└───────────────────┘      │  level, importance, owner_id,             │
                           │  strategic_importance, is_locked          │
                           └─────────────────────────────────────────┘

┌───────────────────┐      ┌─────────────────────┐
│  Interface        │──────│  InterfaceEndpoint  │
│  (Integration)    │ 1:N  │  (API endpoints)   │
└───────────────────┘      └─────────────────────┘

┌───────────────────┐
│  SaaSApplication  │
│  (SaaS registry) │
└───────────────────┘

┌───────────────────┐
│  Project          │
│  (Retirement,    │
│  Migration)       │
└───────────────────┘

┌───────────────────┐
│  User             │
│  (All users)     │
└───────────────────┘
```

---

## 2. Core Entity Schemas

### 2.1 Tenant & Organization

```sql
-- Multi-tenant root
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization within tenant (for enterprise with sub-divisions)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_org_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Units
CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_unit_id UUID REFERENCES business_units(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_orgs_tenant ON organizations(tenant_id);
CREATE INDEX idx_business_units_tenant ON business_units(tenant_id);
```

### 2.2 Application (Core Entity)

```sql
CREATE TABLE applications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Core Identifiers
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    version VARCHAR(100),
    
    -- Classification
    technology_type VARCHAR(100), -- ERP, CRM, BI, Collaboration, Custom, Package, etc.
    custom_attributes JSONB DEFAULT '{}', -- Extensible key-value pairs
    
    -- Ownership
    owner_id UUID REFERENCES users(id),
    business_unit_id UUID REFERENCES business_units(id),
    
    -- Lifecycle
    lifecycle_state VARCHAR(50) DEFAULT 'Planning' 
        CHECK (lifecycle_state IN (
            'Planning', 'Active', 'Maintenance', 
            'Retirement', 'Retired'
        )),
    lifecycle_changed_at TIMESTAMPTZ,
    lifecycle_changed_by UUID REFERENCES users(id),
    lifecycle_reason TEXT,
    
    -- Risk & Quality
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    eol_date DATE,
    eol_risk_level VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN eol_date IS NULL THEN 'Unknown'
            WHEN eol_date < CURRENT_DATE + INTERVAL '6 months' THEN 'Critical'
            WHEN eol_date < CURRENT_DATE + INTERVAL '1 year' THEN 'High'
            WHEN eol_date < CURRENT_DATE + INTERVAL '2 years' THEN 'Medium'
            ELSE 'Low'
        END
    ) STORED,
    
    -- Technical Metadata
    cloud_readiness_score INTEGER CHECK (cloud_readiness_score >= 1 AND cloud_readiness_score <= 5),
    deployment_model VARCHAR(50), -- On-Premise, IaaS, PaaS, SaaS, Hybrid, Multi-cloud
    cloud_provider VARCHAR(50), -- AWS, Azure, GCP, Other
    migration_pattern VARCHAR(50), -- Rehost, Replatform, Refactor, Rearchitect, Replace
    migration_complexity VARCHAR(20), -- Low, Medium, High, Very High
    
    -- Data Classification
    data_classification VARCHAR(50) DEFAULT 'Internal' 
        CHECK (data_classification IN ('Public', 'Internal', 'Confidential', 'Restricted')),
    processes_pii BOOLEAN DEFAULT FALSE,
    processes_phi BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_shadow_it BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    deleted_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_applications_tenant ON applications(tenant_id);
CREATE INDEX idx_applications_lifecycle ON applications(lifecycle_state);
CREATE INDEX idx_applications_owner ON applications(owner_id);
CREATE INDEX idx_applications_bu ON applications(business_unit_id);
CREATE INDEX idx_applications_eol ON applications(eol_date) WHERE eol_date IS NOT NULL;
CREATE INDEX idx_applications_name_gin ON applications USING gin(to_tsvector('english', name));
CREATE INDEX idx_applications_deleted ON applications(tenant_id, deleted_at) WHERE deleted_at IS NULL;
```

### 2.3 Application Cost (TCO Tracking)

```sql
CREATE TABLE application_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Cost breakdown
    cost_type VARCHAR(50) NOT NULL -- License, Infrastructure, Support, Internal_Labor
        CHECK (cost_type IN ('License', 'Infrastructure', 'Support', 'Internal_Labor')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'Annual' -- Monthly, Quarterly, Annual
        CHECK (billing_cycle IN ('Monthly', 'Quarterly', 'Annual')),
    
    -- License specific
    total_seats INTEGER,
    used_seats INTEGER,
    
    -- Tracking
    effective_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_costs_tenant ON application_costs(tenant_id);
CREATE INDEX idx_app_costs_app ON application_costs(application_id);
CREATE INDEX idx_app_costs_date ON application_costs(effective_date);
```

### 2.4 Capability Model

```sql
CREATE TABLE capability_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Tree structure
    parent_id UUID REFERENCES capability_nodes(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
    
    -- Governance
    owner_id UUID REFERENCES users(id),
    strategic_importance VARCHAR(20) DEFAULT 'Medium' 
        CHECK (strategic_importance IN ('Critical', 'High', 'Medium', 'Low')),
    is_locked BOOLEAN DEFAULT FALSE,
    
    -- Review tracking
    review_cadence VARCHAR(20) -- Quarterly, SemiAnnual, Annual, Never
        CHECK (review_cadence IN ('Quarterly', 'SemiAnnual', 'Annual', 'Never')),
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    
    -- Custom attributes
    custom_attributes JSONB DEFAULT '{}',
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tree constraint
    UNIQUE(tenant_id, parent_id, name)
);

CREATE INDEX idx_capability_tenant ON capability_nodes(tenant_id);
CREATE INDEX idx_capability_parent ON capability_nodes(parent_id);
CREATE INDEX idx_capability_owner ON capability_nodes(owner_id);
```

### 2.5 Application ↔ Capability Mapping

```sql
CREATE TABLE application_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    capability_id UUID NOT NULL REFERENCES capability_nodes(id) ON DELETE CASCADE,
    
    support_level VARCHAR(20) NOT NULL DEFAULT 'Supporting'
        CHECK (support_level IN ('Primary', 'Supporting', 'Enabling')),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, application_id, capability_id)
);

CREATE INDEX idx_app_cap_app ON application_capabilities(application_id);
CREATE INDEX idx_app_cap_cap ON application_capabilities(capability_id);
```

### 2.6 Interfaces & Data Flows

```sql
CREATE TABLE interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interface_type VARCHAR(50) NOT NULL
        CHECK (interface_type IN (
            'FileTransfer', 'API_REST', 'API_SOAP', 'MessageQueue', 
            'ETL_Batch', 'DatabaseLink', 'Webhook', 'EventStreaming'
        )),
    
    -- Connection details
    source_application_id UUID REFERENCES applications(id),
    target_application_id UUID REFERENCES applications(id),
    direction VARCHAR(20) DEFAULT 'One-way' CHECK (direction IN ('One-way', 'Bidirectional')),
    frequency VARCHAR(30) DEFAULT 'Real-time'
        CHECK (frequency IN ('Real-time', 'Near-realtime', 'Scheduled', 'On-demand')),
    
    -- Technical details
    protocol VARCHAR(50),
    data_format VARCHAR(50), -- JSON, XML, CSV, Avro, etc.
    authentication_type VARCHAR(50),
    endpoint_url TEXT,
    
    -- SLA
    latency_target_ms INTEGER,
    throughput_target INTEGER,
    availability_target NUMERIC(5,2), -- percentage
    
    -- Data volume
    records_per_day INTEGER,
    avg_message_size_kb INTEGER,
    
    -- PII handling
    processes_pii BOOLEAN DEFAULT FALSE,
    data_classification VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'Active'
        CHECK (status IN ('Planned', 'Development', 'Active', 'Deprecated', 'Retired')),
    deprecated_at TIMESTAMPTZ,
    retirement_date DATE,
    
    -- Governance
    owner_id UUID REFERENCES users(id),
    
    -- Custom attributes
    custom_attributes JSONB DEFAULT '{}',
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interfaces_tenant ON interfaces(tenant_id);
CREATE INDEX idx_interfaces_source ON interfaces(source_application_id);
CREATE INDEX idx_interfaces_target ON interfaces(target_application_id);
CREATE INDEX idx_interfaces_type ON interfaces(interface_type);
```

### 2.7 Technology Components

```sql
CREATE TABLE technology_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL
        CHECK (component_type IN (
            'Server', 'Database', 'Container', 'API_Endpoint', 
            'NetworkDevice', 'CloudService', 'Middleware', 'FileStorage'
        )),
    
    -- Classification
    environment VARCHAR(20) DEFAULT 'Production'
        CHECK (environment IN ('Production', 'Staging', 'Dev', 'Test')),
    status VARCHAR(50) DEFAULT 'Active'
        CHECK (status IN ('Planned', 'Active', 'Decommissioned', 'EndOfLife')),
    
    -- Technical details
    host VARCHAR(255),
    ip_address INET,
    cloud_region VARCHAR(100),
    resource_specs JSONB DEFAULT '{}', -- CPU, RAM, storage
    software_details JSONB DEFAULT '{}', -- OS, version, patches
    
    -- EOL
    eol_date DATE,
    
    -- Data info
    data_classification VARCHAR(50),
    retention_policy VARCHAR(100),
    row_count_estimate BIGINT,
    storage_size_gb NUMERIC(10, 2),
    
    -- Custom attributes
    custom_attributes JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_components (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    component_id UUID REFERENCES technology_components(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, component_id)
);
```

### 2.8 SaaS Application Registry

```sql
CREATE TABLE saas_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Link to application if it's also tracked in APM
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    vendor VARCHAR(255),
    product_url TEXT,
    
    -- Business info
    use_case TEXT,
    approved_by UUID REFERENCES users(id),
    approval_date DATE,
    
    -- Financial
    pricing_model VARCHAR(50) -- PerUser, PerSeat, FlatFee, UsageBased
        CHECK (pricing_model IN ('PerUser', 'PerSeat', 'FlatFee', 'UsageBased')),
    annual_contract_value DECIMAL(15, 2),
    contract_start_date DATE,
    contract_end_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    
    -- Users
    total_seats INTEGER,
    active_users INTEGER,
    last_login_check_date TIMESTAMPTZ,
    
    -- Compliance
    data_residency VARCHAR(100),
    certifications JSONB DEFAULT '[]', -- ['SOC2', 'ISO27001', 'GDPR', 'HIPAA']
    has_dpa BOOLEAN DEFAULT FALSE, -- Data Processing Agreement
    
    -- Shadow IT
    is_shadow_it BOOLEAN DEFAULT FALSE,
    discovered_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.9 Users & Access Control

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(100),
    department VARCHAR(100),
    manager_id UUID REFERENCES users(id),
    
    -- SSO
    sso_provider VARCHAR(50),
    sso_subject VARCHAR(255), -- IdP unique identifier
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- System roles can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL, -- applications, capabilities, etc.
    action VARCHAR(50) NOT NULL,   -- create, read, update, delete
    scope VARCHAR(50) DEFAULT 'all' -- all, own, business_unit
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    business_unit_id UUID REFERENCES business_units(id), -- Scope limitation
    PRIMARY KEY (user_id, role_id, business_unit_id)
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

### 2.10 Audit Log (Immutable)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Who & When
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- What
    entity_type VARCHAR(100) NOT NULL, -- application, capability, user, etc.
    entity_id UUID,
    entity_name VARCHAR(255),
    
    -- Change details
    action VARCHAR(20) NOT NULL -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
        CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT')),
    
    -- For UPDATE: capture changed fields
    changes JSONB DEFAULT '[]', -- [{field, old_value, new_value}]
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Immutable: no updated_at, no ON UPDATE
    CONSTRAINT audit_log_immutable CHECK (TRUE)
);

-- Make audit_log append-only (no UPDATE or DELETE)
CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(action_timestamp DESC);
CREATE INDEX idx_audit_entity_tenant ON audit_log(tenant_id, entity_type, entity_id);
```

### 2.11 Comments & Collaboration

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    
    author_id UUID NOT NULL REFERENCES users(id),
    parent_comment_id UUID REFERENCES comments(id), -- For threading
    content TEXT NOT NULL,
    
    -- Context
    field_name VARCHAR(100), -- If comment is about a specific field
    
    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    -- Reactions
    reactions JSONB DEFAULT '[]', -- [{emoji, user_id}]
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_entity ON comments(tenant_id, entity_type, entity_id);
CREATE INDEX idx_comments_thread ON comments(parent_comment_id);
```

---

## 3. Graph Extension (Neo4j) — Phase 2

For advanced relationship traversal (data lineage, dependency graphs, multi-hop queries):

```cypher
// Node types
(:Tenant {id: "uuid"})
-[:OWNS]->
(:Application {id: "uuid", name: "ERP System"})
-[:SUPPORTS {level: "Primary"}]->
(:Capability {id: "uuid", name: "Financial Management"})
-[:SUPPORTS]->
(:Capability {id: "uuid", name: "General Ledger"})

// Data lineage
(:DataSource)-[:PRODUCES]->(:Interface {name: "GL Interface"})
-[:CONSUMES]->(:Application {name: "Data Warehouse"})
-[:FEEDS_INTO]->(:Report {name: "P&L Report"})
```

---

## 4. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **UUID primary keys** | Distributed generation, no collision risk |
| **Soft deletes** | Audit/compliance requirement, no data loss |
| **JSONB for extensible fields** | Allow custom attributes without schema migrations |
| **tenant_id on every table** | Multi-tenancy isolation at the row level |
| **Audit log is append-only** | Tamper-proof audit trail |
| **Generated columns for EOL risk** | Automatic calculation, always consistent |
| **Separate SaaS table** | Different lifecycle, different fields vs. on-prem apps |
| **Separate cost history table** | Time-series cost data, trends, comparisons |
| **Nested capability tree** | Self-referential parent_id, supports unlimited depth |
| **Application ↔ Capability as explicit join table** | Many-to-many with support_level attribute |

---

## 5. Migration Strategy

```bash
# Use Prisma Migrate for schema management
npx prisma migrate dev --name init
npx prisma migrate deploy

# For production: never auto-apply migrations
# 1. Review migration SQL
# 2. Test in staging
# 3. Apply during maintenance window with backup
```

---

*Previous: [Technical Architecture ←](./09-technical-architecture.md) | Next: [Implementation Roadmap →](./11-implementation-roadmap.md)*
