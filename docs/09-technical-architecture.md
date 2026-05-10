# Technical Architecture Guide

## Overview
This section provides **technical architecture recommendations** for building the EAM platform. It covers the recommended tech stack, deployment architecture, security model, and design principles.

---

## 1. Recommended Technology Stack

### 1.1 Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 18 + TypeScript + Next.js 14 (App Router) | Type safety, SSR, strong ecosystem |
| **State Management** | Zustand (lightweight) or TanStack Query (server state) | Predictable state, caching, optimistic updates |
| **UI Components** | shadcn/ui + Radix UI primitives | Accessible, customizable, open-source |
| **Charts & Visualization** | Recharts, D3.js, Apache ECharts | Rich charting, graph/network layouts |
| **Forms** | React Hook Form + Zod | Performance, schema validation |
| **Diagrams** | React Flow (node graphs), Mermaid (flowcharts) | C4 diagrams, dependency graphs, data lineage |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **Internationalization** | react-i18next | Multi-language support |
| **Testing** | Vitest + Playwright | Unit and E2E testing |

---

### 1.2 Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 20 LTS (or Deno 2) | TypeScript end-to-end, strong npm ecosystem |
| **Framework** | NestJS or Fastify | NestJS for enterprise structure, Fastify for performance |
| **API Style** | REST (primary) + GraphQL (complex queries, Phase 2) | REST for simplicity, GraphQL for flexible data fetching |
| **ORM** | Prisma (PostgreSQL) | Type-safe queries, migrations, excellent DX |
| **Database** | PostgreSQL 16 (primary) | ACID compliance, relational integrity, JSON support |
| **Graph DB** | Neo4j (optional, Phase 2) | Superior for relationship traversal (lineage, dependencies) |
| **Search** | Elasticsearch or Typesense | Full-text search, faceting, autocomplete |
| **Cache** | Redis | Session store, query caching, rate limiting |
| **Queue** | BullMQ (Redis-backed) | Async jobs: imports, exports, report generation |
| **File Storage** | S3-compatible (MinIO for on-prem) | Import/export file storage |

---

### 1.3 Infrastructure & DevOps

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Containerization** | Docker + Docker Compose | Consistent environments |
| **Orchestration** | Kubernetes (EKS/AKS/GKE) or Docker Swarm | Auto-scaling, self-healing |
| **CI/CD** | GitHub Actions or GitLab CI | Pipeline automation, PR checks |
| **IaC** | Terraform | Infrastructure provisioning as code |
| **Secrets** | HashiCorp Vault or AWS Secrets Manager | Secure credential management |
| **Monitoring** | Prometheus + Grafana or Datadog | Metrics, alerting, dashboards |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) or Loki | Centralized logging |
| **Error Tracking** | Sentry | Real-time error monitoring |
| **CDN** | CloudFront / Cloudflare | Static asset delivery, DDoS protection |
| **Email** | SendGrid or AWS SES | Transactional email delivery |

---

## 2. Deployment Architecture

### 2.1 Cloud-Native Architecture (Recommended for SaaS)

```
                          ┌─────────────────────┐
                          │      CDN / WAF       │
                          │  (Cloudflare/AWS)    │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │    Load Balancer     │
                          │   (Application LB)   │
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼──────────┐ ┌────────▼────────┐ ┌──────────▼──────────┐
   │   Web Server Pods   │ │  API Server Pods │ │   Worker Pods        │
   │   (Next.js SSR)     │ │  (NestJS/Fastify)│ │   (BullMQ Jobs)      │
   │   Replica: 3+       │ │  Replica: 3+      │ │   Import/Export      │
   └──────────┬──────────┘ └────────┬─────────┘ └──────────────────────┘
              │                      │
              │         ┌────────────┴───────────┐
              │         │                         │
   ┌──────────▼──────────▼──┐        ┌────────────▼──────────────┐
   │      Object Storage    │        │     PostgreSQL Primary     │
   │       (S3/MinIO)       │        │     + Read Replica         │
   └────────────────────────┘        └────────────┬──────────────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │    Redis (Cache + Queue)    │
                                    └─────────────────────────────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │     Elasticsearch           │
                                    │   (Full-Text Search)       │
                                    └─────────────────────────────┘
```

### 2.2 Multi-Tenant Data Architecture

**Option A: Shared Database, Shared Schema (Row-Level Isolation)**
- All tenants share one PostgreSQL database
- Every table has a `tenant_id` column
- RLS (Row-Level Security) policies enforce tenant isolation at the DB level
- Pros: Lower cost, simpler operations
- Cons: Less strict isolation, shared failure domain

**Option B: Shared Database, Schema-Per-Tenant**
- Each tenant has their own schema within a shared PostgreSQL instance
- Pros: Stronger isolation, easier per-tenant backup/restore
- Cons: Schema migrations must run per tenant

**Option C: Database-Per-Tenant (Recommended for Enterprise)**
- Each tenant gets their own PostgreSQL database
- Pros: Maximum isolation, independent scaling, regulatory compliance
- Cons: Higher infrastructure cost, operational complexity

**Recommendation:** Start with Option A (shared DB, RLS) for MVP, migrate to Option B or C as tenant count grows.

---

## 3. API Design Principles

### 3.1 RESTful API Structure

```
Base URL: https://api.basenap.com/v1

Entities:
  /applications
  /applications/:id
  /applications/:id/interfaces
  /applications/:id/capabilities
  /applications/:id/relationships
  
  /capabilities
  /capabilities/:id
  /capabilities/:id/applications
  
  /interfaces
  /interfaces/:id
  
  /saas-applications
  /saas-applications/:id
  
  /components
  /components/:id
  
  /users
  /users/:id
  
  /reports
  /reports/:id/generate
```

### 3.2 Standard API Conventions

```
GET    /applications              → List (paginated)
GET    /applications/:id          → Get single
POST   /applications              → Create
PUT    /applications/:id          → Full update
PATCH  /applications/:id          → Partial update
DELETE /applications/:id          → Soft delete (set status = retired)

Query Parameters:
  ?page=1&limit=25                → Pagination
  ?search=ERP                      → Full-text search
  ?filter[lifecycle]=Active       → Field filters
  ?sort=-cost&sort=name           → Multi-sort
  ?fields=id,name,cost            → Sparse fieldsets

Response Format:
{
  "data": [...],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 25,
    "totalPages": 50
  }
}

Error Format:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

---

## 4. Security Architecture

### 4.1 Authentication & Authorization

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| **Web App** | Session-based with HttpOnly cookies | NextAuth.js or custom JWT in HttpOnly cookie |
| **Mobile/SSO** | SAML 2.0 / OIDC | Passport.js or dedicated auth service |
| **API** | JWT Bearer tokens + API keys | Access token (15 min) + Refresh token (7 days) |
| **RBAC** | Policy-based | Casbin or OPA (Open Policy Agent) |
| **Field-level** | Column-level permissions in ORM | Zod schemas + middleware enforcement |

### 4.2 Data Security

| Concern | Solution |
|---------|----------|
| **Encryption at rest** | AES-256 for PostgreSQL (via pgcrypto or cloud KMS) |
| **Encryption in transit** | TLS 1.3 everywhere, HSTS header |
| **Field-level encryption** | Sensitive fields (PII) encrypted with tenant-specific keys |
| **Key management** | AWS KMS, HashiCorp Vault, or Azure Key Vault |
| **Secrets management** | Environment variables + Vault for runtime secrets |
| **Audit logging** | Immutable append-only log table, no DELETE/UPDATE allowed |
| **Input validation** | Zod schemas on all API inputs |
| **SQL injection** | Parameterized queries via Prisma ORM (no raw SQL) |
| **XSS** | React auto-escapes, CSP headers, sanitized rich text |

### 4.3 Compliance Controls

- **GDPR:** Data residency by tenant region, right to erasure (soft delete + purge job), data processing agreement
- **SOC 2 Type II:** Annual audit, availability monitoring, incident response plan, access reviews
- **HIPAA (Phase 2):** BAA with cloud provider, PHI field encryption, audit controls

---

## 5. Performance & Scalability

### 5.1 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Dashboard load (p95)** | < 2 seconds | Server-side rendering, query optimization, Redis caching |
| **Search latency (p95)** | < 500ms | Elasticsearch with autocomplete index |
| **API response (p95)** | < 300ms | Connection pooling, query indexing, Redis cache |
| **Import processing** | > 1,000 rows/minute | Background job queue (BullMQ) |
| **Export generation** | > 5,000 rows/minute | Async job + S3 download link |
| **Concurrent users** | 500+ per tenant | Stateless API servers, horizontal scaling |

### 5.2 Caching Strategy

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  (React Query: client-side cache, stale-while-revalidate) │
└──────────────────────┬──────────────────────────┘
                       │ Cache-Control headers
┌──────────────────────▼──────────────────────────┐
│               Redis Cache Layer                  │
│  - Session store                                 │
│  - API response cache (TTL: 5 min for lists)    │
│  - Rate limit counters                          │
│  - Search autocomplete suggestions               │
└─────────────────────────────────────────────────┘
```

### 5.3 Database Optimization

- **Indexing:** Every foreign key, frequently filtered fields, full-text search columns
- **Pagination:** Always use cursor-based pagination for large datasets
- **Query optimization:** `EXPLAIN ANALYZE` on all slow queries (> 100ms)
- **Read replicas:** Offload read-heavy queries (reports, dashboards) to replicas
- **Connection pooling:** PgBouncer with 20-50 connections per server

---

## 6. Observability & Reliability

### 6.1 Monitoring Stack

```
Metrics      → Prometheus + Grafana (dashboards, alerting)
Logs         → Structured JSON logs → Loki/ELK → Kibana/Grafana
Traces       → OpenTelemetry + Tempo (distributed tracing)
Errors       → Sentry (source maps, stack traces, releases)
Uptime       → Health check endpoint → PagerDuty integration
```

### 6.2 Health Check Endpoints

```
GET /health           → Overall health (DB, Redis, Elasticsearch)
GET /health/ready     → Readiness (all dependencies up)
GET /health/live      → Liveness (app process running)
```

### 6.3 Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| API latency | p95 > 1s for 5 min | Warning | Investigate |
| API latency | p95 > 3s for 2 min | Critical | Page on-call |
| Error rate | 5xx > 1% for 5 min | Warning | Investigate |
| DB connections | > 80% pool usage | Warning | Scale or optimize |
| Disk usage | > 70% | Warning | Alert ops |
| Disk usage | > 85% | Critical | Page on-call |
| Import job | pending > 1 hour | Warning | Check queue health |

---

## 7. Recommended Development Practices

### 7.1 Code Architecture

```
src/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS/Fastify backend
├── packages/
│   ├── ui/               # Shared React component library
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utilities
│   └── config/           # Shared configs (ESLint, TSConfig)
├── infrastructure/       # Terraform, Docker, Kubernetes
└── docs/                # Documentation
```

### 7.2 Data Model Principles

- **Single Source of Truth:** Each entity has one authoritative owner service
- **Event Sourcing (Phase 2):** Audit log as event store for full history reconstruction
- **No direct joins across module boundaries:** Use API calls, not shared DB
- **Soft deletes by default:** No hard deletes of user data (audit/compliance)

### 7.3 API Versioning

- Version in URL path: `/v1/`, `/v2/`
- Maintain previous version for 12 months after deprecation notice
- Breaking changes require version bump
- Non-breaking additions: new fields, new optional parameters are fine in same version

### 7.4 Testing Strategy

| Type | Tool | Coverage Target |
|------|------|----------------|
| Unit tests | Vitest | 80% on backend, 70% on frontend |
| Integration tests | Supertest (API), React Testing Library | Critical paths |
| E2E tests | Playwright | Core user journeys |
| Performance tests | k6 | p95 latency under threshold |

---

*Previous: [Cross-Cutting Platform Features ←](./08-platform-features.md) | Next: [Data Model Design →](./10-data-model.md)*
