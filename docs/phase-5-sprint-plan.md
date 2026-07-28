# Phase 5: Enterprise Scale — Sprint Plan

> **Duration:** Months 16–18 | **Team:** 8 | **Goal:** Multi-tenancy, compliance, localization, and enterprise readiness.
> **Based on:** Implementation Plan Sprints 33–40, revised to address risks identified in codebase audit.

---

## Overview of Changes from Original Plan

| Issue | Resolution |
|-------|-----------|
| Sprint 35 overloaded (168h) | i18n split across Sprints 33-35; rebalanced to 160h |
| i18n setup underestimated (94 files to extract) | Moved to Sprint 34, increased to 24h |
| SOC 2 needs ~12 week lead time | Gap analysis starts in Sprint 33 |
| SSO missing from Phase 0 | Built in Sprint 33 (24h), enables tenant onboarding wizard |
| C4 diagram editor likely underestimated | Scoped to 16h using existing @xyflow/react library |
| Cross-tenant reporting not urgent | Moved from Sprint 33 to Sprint 35 |
| Billing stub not blocking | Moved from Sprint 33 to Sprint 34 |
| Rate limiting belongs with tenants | Moved from Sprint 39 to Sprint 38 |
| On-prem docs fits with compliance | Moved from Sprint 34 to Sprint 36 |

### Totals

| Sprint | Hours | Theme |
|--------|-------|-------|
| 33 | 136 | Multi-Tenant + SSO + SOC 2 Prep |
| 34 | 144 | On-Premise + i18n Setup + Billing |
| 35 | 160 | Translations + Accessibility + Cross-Tenant Reporting |
| 36 | 136 | Compliance and Security |
| 37 | 132 | Advanced Workflows + C4 Diagrams |
| 38 | 140 | Technology Standards + Rate Limiting |
| 39 | 120 | Final Hardening |
| 40 | 108 | Launch |
| **Total** | **1076** | |

---

## Sprint 33: Multi-Tenant + SSO + SOC 2 Prep (136h)

### 33.1 - Tenant Provisioning API (20h, BE)

**Files to create:**
- pps/api/src/tenants/tenants.module.ts
- pps/api/src/tenants/tenants.controller.ts
- pps/api/src/tenants/tenants.service.ts

**Implementation:**
- POST /tenants - Create tenant with name, slug auto-generation, plan assignment
- GET /tenants - List all tenants (admin-only)
- GET /tenants/:id - Get tenant details
- PATCH /tenants/:id - Update tenant settings, plan
- Admin-only guard on all endpoints
- Validate slug uniqueness; reject reserved slugs
- Audit logging on all tenant mutations
- Slug auto-generation: lowercase, replace spaces with hyphens, append random suffix if taken

**Prisma:** No new model needed - Tenant model already exists with id, name, slug, plan, settings.

---

### NEW - SSO/OIDC Implementation (24h, BE)

**Files to create:**
- pps/api/src/auth/strategies/saml.strategy.ts
- pps/api/src/auth/strategies/oidc.strategy.ts

**Files to modify:**
- pps/api/src/auth/auth.module.ts - register new strategies
- pps/api/src/auth/auth.controller.ts - add SSO login/callback endpoints
- pps/api/src/auth/auth.service.ts - add JIT provisioning

**Implementation:**
- SAML strategy: POST /auth/sso/saml - accepts SAML Response XML from IdP
- OIDC strategy: redirect to IdP, handle auth code callback
- User model already has sso_provider + sso_subject columns - JIT provisioning fills them
- Tenant-scoped SSO config stored in Tenant.settings.sso JSON
- Support Okta and Azure AD as initial providers
- Fallback to email/password if SSO not configured

---

### 33.2 - Tenant Onboarding Wizard (16h, FE)

**Files to create:**
- pps/web/src/app/onboarding/page.tsx
- pps/web/src/app/onboarding/steps/tenant-info.tsx
- pps/web/src/app/onboarding/steps/admin-setup.tsx
- pps/web/src/app/onboarding/steps/sso-config.tsx
- pps/web/src/app/onboarding/steps/branding.tsx

**Implementation:**
- Multi-step wizard with progress bar
- Step 1: Tenant info (name, slug, plan)
- Step 2: Admin user (email, password, name)
- Step 3: SSO config (optional - IdP metadata)
- Step 4: Branding (logo, colors)
- Skip option for steps 3 and 4

---

### 33.3 - Per-Tenant Feature Flags (16h, BE)

**Files to create:**
- pps/api/src/feature-flags/feature-flags.module.ts
- pps/api/src/feature-flags/feature-flags.service.ts
- pps/api/src/feature-flags/feature-flags.controller.ts

**Implementation:**
- Feature flags stored in Tenant.settings.feature_flags JSON
- Service: getFeatureFlag(tenantId, key): boolean
- Default values per environment via config
- Redis caching with 5-minute TTL
- Admin API: PUT /tenants/:id/feature-flags
- Pre-defined flags: advanced_analytics, ai_recommendations, graph_view, custom_reports, audit_logs

---

### 33.4 - Storage and Rate Limits (16h, BE)

**Files to create:**
- pps/api/src/common/middleware/rate-limit.middleware.ts

**Files to modify:**
- pps/api/src/app.module.ts - register middleware

**Implementation:**
- Per-tenant rate limits via Tenant.settings.quotas
- Plan defaults: starter=100/min, professional=500/min, enterprise=2000/min
- 429 response with Retry-After header
- X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers

---

### 33.5 - Tenant Admin Panel (12h, FE)

**Files to modify:**
- pps/web/src/app/settings/page.tsx - extend with new tabs

**Implementation:**
- Extend existing Settings page with admin-only tabs:
  - Plan and Billing - current plan, usage limits
  - Feature Flags - toggle switches
  - SSO Configuration - IdP fields
  - Data Management - export, delete tenant

---

### 33.6 - Tenant Deletion / GDPR Erasure (12h, BE + FE)

**Files to create:**
- pps/api/src/tenants/tenants-export.service.ts

**Implementation:**
- DELETE /tenants/:id with 30-day grace period
- Data export endpoint (async JSON/CSV)
- Cancel deletion during grace period
- Frontend: danger zone with confirmation dialog

---

### 33.7 - SOC 2 Gap Analysis (24h, Security - moved from Sprint 36)

**Implementation:**
- Map existing controls to SOC 2 Trust Service Criteria
- Populate ComplianceFramework with SOC 2 controls
- Document gaps and remediation timeline
- Create evidence collection checklist


---

## Sprint 34: On-Premise + i18n Setup + Billing (144h)

### 34.1 - Docker Compose for On-Premise (24h, DevOps)

**Files to modify:**
- docker-compose.yml - add on-prem services, health checks, resource limits
- docker-compose.onprem.yml - new file for on-prem overrides

**Implementation:**
- Add MinIO service (S3-compatible object storage)
- Health checks for all services (postgres, redis, es, neo4j, minio, api, web)
- Resource limits (CPU/memory reservations per service)
- Docker Compose profiles: dev vs onprem

---

### 34.2 - Helm Chart for Kubernetes (24h, DevOps)

**Files to create:**
- charts/basemap/Chart.yaml, alues.yaml, templates/

**Implementation:**
- Deployment templates for api, web
- Service, Ingress with TLS, PVC for databases
- Secrets management via values.yaml or external store
- ConfigMap for env-specific config
- Validated with helm lint in CI

---

### 34.3 - MinIO for Object Storage (12h, DevOps)

**Files to create:**
- pps/api/src/storage/storage.module.ts
- pps/api/src/storage/storage.service.ts
- scripts/init-minio.sh

**Implementation:**
- Storage service abstraction (local / MinIO / S3)
- Bucket creation on startup (exports, imports, backups)
- Presigned URL generation
- Configurable via STORAGE_PROVIDER env var

---

### 34.4 - Offline Installation Support (20h, DevOps)

**Files to create:**
- scripts/offline-bundle.sh
- docker-compose.offline.yml

**Implementation:**
- Script to pull and bundle all Docker images
- Offline compose file referencing local images
- Include Prisma migration binary in bundle
- Test in air-gapped environment

---

### 34.5 - Environment-Specific Configuration (16h, DevOps)

**Files to create:**
- .env.development, .env.staging, .env.production
- pps/api/src/config/env.config.ts - Zod validation

**Implementation:**
- Zod schema for all env vars with defaults
- Config service loading based on NODE_ENV
- Fail-fast on missing required variables

---

### 34.6 - Zero-Downtime Upgrade Script (20h, DevOps)

**Files to create:**
- scripts/upgrade.sh
- scripts/rollback.sh

**Implementation:**
- Flow: backup DB, run migrations, deploy new version, smoke test
- Blue-green deployment approach
- Rollback: restore DB backup, deploy previous version, verify

---

### 34.7 - i18n Setup + String Extraction (24h, FE - moved from Sprint 35)

**Files to create:**
- pps/web/src/lib/i18n.ts
- pps/web/messages/en.json

**Files to modify:**
- pps/web/next.config.ts - add next-intl plugin
- pps/web/src/app/layout.tsx - wrap with NextIntlClientProvider

**Implementation:**
- Add next-intl package
- Extract all hardcoded strings from 94 frontend files into messages/en.json
- Group translations by component/page for maintainability
- Support locale from URL (/de/settings) or cookie

---

### 34.8 - Billing Integration Stub (16h, BE - moved from Sprint 33)

**Files to create:**
- pps/api/src/billing/billing.module.ts
- pps/api/src/billing/billing.controller.ts
- pps/api/src/billing/billing.service.ts

**Implementation:**
- Stripe customer creation on tenant signup
- Webhook endpoint for subscription events
- Plan mapping: starter/professional/enterprise to Stripe prices
- Customer Portal session endpoint
- Graceful degradation if Stripe keys not configured

---

## Sprint 35: Translations + Accessibility + Cross-Tenant Reporting (160h)

### 35.1 - German Translation (24h, FE)
- Translate all ~600 strings to German
- File: pps/web/messages/de.json

### 35.2 - French Translation (24h, FE)
- Translate all ~600 strings to French
- File: pps/web/messages/fr.json

### 35.3 - Spanish Translation (24h, FE)
- Translate all ~600 strings to Spanish
- File: pps/web/messages/es.json

### 35.4 - RTL Support Infrastructure (8h, FE)
- RTL locale list and dir attribute switching
- RTL-aware CSS in globals.css

### 35.5 - WCAG 2.1 AA Accessibility Audit (24h, QA)
- Automated (axe-core) + manual audit of all 27 pages
- Document all issues with severity

### 35.6 - Accessibility Remediation (32h, FE)
- Fix keyboard navigation, focus management, ARIA labels
- Color contrast, heading hierarchy, form error announcements
- Re-test after fixes

### 35.7 - Screen Reader Testing (16h, QA)
- Test with NVDA (Windows) and VoiceOver (macOS)
- Key flows: Login to Dashboard to Create App to Reports

### 35.8 - Cross-Tenant Reporting (16h, BE - moved from Sprint 33)
- Admin endpoint: aggregate usage stats across all tenants
- Metrics: tenants, active users, apps, costs, storage

---

## Sprint 36: Compliance & Security (136h)

### 36.1 - Access Review Process (16h, BE)
- New model: AccessCertification, AccessCertificationItem
- Quarterly certification workflow: create cycle, manager reviews, escalation
- Endpoints: POST /users/certifications, GET pending, PATCH items

### 36.2 - Data Retention Policy (16h, BE)
- Configurable retention per entity type (audit_logs: 365d, notifications: 30d, etc.)
- Scheduled job runs daily, soft-deletes/purges past retention
- Admin API: GET/PUT /admin/retention-settings

### 36.3 - Incident Response Plan Documentation (16h, Security)
- File: docs/security/incident-response-plan.md
- Severity definitions, response steps, escalation tree, templates

### 36.4 - Penetration Testing (24h, Security)
- External pentest or OWASP ZAP automated scan
- Fix all Critical/High findings, re-test
- Document residual risk

### 36.5 - Encryption Audit (12h, Security)
- Verify TLS 1.3 in transit, AES-256 at rest
- Secret management review

### 36.6 - SOC 2 Evidence Collection (24h, Security)
- Populate ComplianceControl records with evidence
- Screenshots, configs, logs per control
- Track compliance status

### 36.7 - SOC 2 Readiness Assessment (16h, Security)
- Pre-audit review with external auditor
- Identify remaining gaps, timeline for closure

### 36.8 - On-Premise Documentation (16h, DevOps - moved from Sprint 34)
- Files: installation.md, backup-restore.md, upgrade.md, troubleshooting.md


---

## Sprint 37: Advanced Workflows + C4 Diagrams (132h)

### 37.1 - Visual Workflow Designer (28h, FE)

**Files to create:**
- pps/web/src/app/workflows/page.tsx
- pps/web/src/components/workflows/WorkflowDesigner.tsx
- pps/web/src/components/workflows/StepPalette.tsx
- pps/web/src/components/workflows/StepConfigPanel.tsx

**Implementation:**
- Use existing @xyflow/react library (already imported in DependencyGraph)
- Drag-and-drop canvas: palette, canvas, config panel
- Nodes = workflow steps, Edges = transitions
- Save/load workflow definitions, test mode

### 37.2 - Step Types Backend (20h, BE)

**Models to add:**
- WorkflowDefinition (name, entity_types, is_active)
- WorkflowStep (step_type, config, position_x, position_y)

**Step types:**
- Approval (assignee_role, require_comment, timeout)
- Review (assignee_role, require_evidence)
- Notification (channel, template, recipients)
- Webhook (url, method, payload template)
- Condition (expression, true_step, false_step)

### 37.3 - Conditional Branching (16h, BE)
- Expression evaluator: nd/or, > < =, field references
- Variables: entity fields, requester info, previous step results

### 37.4 - Parallel Approvals (16h, BE)
- Config: all-must-approve (AND) vs any-can-approve (OR)
- Timeout handling per branch

### 37.5 - C4 Diagram Editor (Simplified, 16h, FE)

**Files to create:**
- pps/web/src/app/c4-diagrams/page.tsx
- pps/web/src/components/c4/C4DiagramEditor.tsx

**Implementation:**
- Reuse @xyflow/react with custom C4 node types
- Pre-built shapes: Person, Software System, Container, Component, Database
- Drag from palette, connect with labeled edges
- Edit properties (name, description, technology, linked entity)
- Focused on C4 notation only - not a full draw.io

### 37.6 - C4 Diagram Versioning (12h, BE)

**Models to add:**
- C4Diagram (name, level, elements, connections)
- C4DiagramVersion (snapshot, comment, created_by)

**Implementation:**
- Save snapshot on each edit, keep last 50 versions
- Restore, diff, delete versions

### 37.7 - Link Diagram Elements to Entities (16h, BE + FE)
- Element config: linked_entity_type + linked_entity_id
- Click navigates to entity detail page
- Entity page shows View in C4 Diagram button

### 37.8 - C4 Export to PNG/SVG/PDF (12h, FE)
- PNG (html-to-image, already in deps)
- SVG (native browser serialization)
- PDF (jspdf, already in deps)

---

## Sprint 38: Technology Standards + Rate Limiting (140h)

### 38.1 - Tech Standards CRUD (16h, BE)

**Model:**
- TechStandard (name, category, status, version_range, sunset_date)

**Categories:** language, database, os, cloud_provider, framework, tool
**Status:** proposed, active, deprecated, retired

### 38.2 - Standard Categories (12h, BE)
- Predefined category CRUD with descriptions

### 38.3 - Application Compliance Scoring (20h, BE)
- Score = compliant_components / total_components * 100
- Check each component type+version against active standards
- Cache per application, invalidate on standard update

### 38.4 - Flag Deprecated/Banned Technologies (12h, BE + FE)
- Warning banner on application detail page
- Compliance badge on component list

### 38.5 - Standards Approval Workflow (20h, BE)
- Leverage workflow engine from Sprint 37
- Flow: Propose, Review, Approve/Reject/Request Changes

### 38.6 - Standards Lifecycle (12h, BE)
- State machine: proposed -> active -> deprecated -> retired
- Auto-retire after sunset_date via scheduled job

### 38.7 - Tech Standards Dashboard (12h, FE)
- Summary cards, compliance pie/bar charts
- Drill-down to affected applications

### 38.8 - Capability KPI Tracking (20h, BE)

**Models to add:**
- CapabilityKpi (name, unit, description)
- CapabilityKpiValue (value, recorded_at)

**Implementation:**
- Manual or auto-calculated KPIs per capability
- Trend chart on capability detail page

### 38.9 - API Rate Limiting (16h, BE - moved from Sprint 39)
- Token bucket algorithm in Redis
- Per-tenant limits based on plan
- 429 response, rate limit headers

---

## Sprint 39: Final Hardening (120h)

### 39.1 - Performance Regression Testing (16h, QA)
- Run existing k6 tests + new scenarios (search, reports, graphs)
- Verify against Sprint 32 baseline

### 39.2 - Security Regression Testing (16h, Security)
- Re-run OWASP ZAP scan
- Verify Sprint 36 fixes hold

### 39.3 - E2E Test Suite with Playwright (24h, QA)
- Playwright config, smoke tests for all 27 pages
- Critical path: login, create app, create capability, map, report, export

### 39.4 - User Documentation (24h, PM)
- User guide: getting started, apps, capabilities, reports, SaaS, workflows
- Admin guide: RBAC, tenants, integrations
- API docs via Swagger

### 39.5 - Onboarding Materials (12h, PM)
- Demo script, sample data, FAQ

### 39.6 - Runbook Update (12h, DevOps)
- Deploy, rollback, backup/restore, scale, incident response

### 39.7 - Transition to Support (16h, All)
- Knowledge base, escalation paths, support handoff

---

## Sprint 40: Launch (108h)

### 40.1 - Onboard First 3 SaaS Customers (16h, PM)
- Provision tenants, SSO setup, guided demo, collect feedback

### 40.2 - On-Prem Customer Deployment (16h, DevOps)
- Helm/Docker Compose deployment, backup test, sign-off

### 40.3 - SOC 2 Type II Audit Completion (16h, Security)
- Final auditor review, address findings, publish report

### 40.4 - Launch Announcement (8h, PM)
- Press release/blog post, Product Hunt, website update

### 40.5 - Post-Launch Retrospective (12h, All)
- What went well, improvements, action items

### 40.6 - v2 Roadmap Planning (16h, PM)
- Prioritize customer feedback, estimate top 10 features

### 40.7 - Project Close (8h, All)
- Tag v1.0.0, archive docs, celebrate

---

## Phase 5 Exit Criteria (Gate G5)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G5.1 | 3+ SaaS customers live and using product daily | PM |
| G5.2 | On-premise customer successfully deployed | DevOps |
| G5.3 | SOC 2 Type II report available | Security |
| G5.4 | Platform passes WCAG 2.1 AA accessibility audit | QA |
| G5.5 | All critical and major security findings resolved | Security |
| G5.6 | User documentation and API docs complete | PM |
| G5.7 | All 27 pages pass E2E smoke tests | QA |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SOC 2 reveals critical gaps at final review | Low | High | Gap analysis started Sprint 33; continuous monitoring |
| Translation quality issues | Medium | Low | Professional translators + in-house review |
| On-prem deployment complexity | Medium | Medium | Test in air-gapped env early (Sprint 34) |
| Workflow designer scope creep | Medium | Medium | Strictly defined step types; no custom scripting |
| E2E test maintenance burden | Low | Low | Focus on critical path tests only |

---

*Document version: 1.0 | Last updated: July 2026 | Phase 5 Sprint Plan*
