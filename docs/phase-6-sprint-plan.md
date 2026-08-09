# Phase 6 (V2.1–V2.3) Implementation Plan

> **Duration:** Months 19–21 | **Team:** 8 | **Goal:** Customer-validated V2: financial depth, smarter discovery, integration reach, automation, governance surfaces, and a mobile shell.
> **Based on:** `docs/launch/v2-roadmap.md` (prioritized top 10), `docs/launch/retrospective.md` (action items), and the Phase 5 close (40.7).

---

## Overview

| Milestone | Sprints | Theme |
|-----------|---------|-------|
| V2.1 | 41–43 | Platform hardening + Budget/TCO + AI-assisted mapping + BI export adapters |
| V2.2 | 44–45 | Workflow automation (webhook/timer steps) + report digests + regional residency |
| V2.3 | 46–48 | RBAC horizons + SaaS billing ingest + mobile shell + import validation + V2 launch |

### Changes and Risks from Original Roadmap

| Roadmap Item | Change / Rationale |
|--------------|--------------------|
| #1 Budget & TCO (L) | Split across Sprints 41–42: schema+API+FE first, TCO projection engine second. Reduces single-sprint risk. |
| #2 AI app→capability mapping (M) | Pulled into V2.1 (Sprint 43) after customer feedback #1 spending; reuses existing `AIRecommendation` model. |
| #3 Warehouse/BI export adapters | Depends on existing `ExportTemplate`/`ScheduledExport`; build generic adapter framework in Sprint 43. |
| #4 Workflow webhook/timer steps | Extends the Sprint 37 step evaluator; no new engine work needed. |
| #5 Regional residency | Ties into existing `RetentionPolicy` + SaaS residency; compliance team sign-off in Sprint 46. |
| #10 Import validation + dry-run | Moved into V2.3 (Sprint 47) alongside mobile shell to keep Sprints 41–42 focused on finance. |

### Staleness / Risk Corrections

| Issue | Resolution |
|-------|-----------|
| Prisma client staleness (root) | Sprint 41.1 enforces workspace-root `prisma generate` + green `tsc -p` as entry gate |
| Runtime verification weak | Sprint 41.2 wires Playwright smoke + k6 into CI |
| Thin FE pages | Round-out budgeted 8h/sprint across 41–48 |
| External dependencies (pentest/auditor) | Sprint 45 explicitly schedules pentest + SOC 2 re-validation window |

### Totals

| Sprint | Hours | Theme |
|--------|-------|-------|
| 41 | 126 | Hardening Gate + Budget/TCO Foundations |
| 42 | 124 | Financial Planning Depth |
| 43 | 116 | AI Discovery + BI Adapters |
| 44 | 116 | Workflow Automation + Report Digests |
| 45 | 118 | Residency + Compliance Re-validation |
| 46 | 122 | RBAC Horizons + SaaS Ingest |
| 47 | 102 | Mobile Shell + Import Validation |
| 48 | 90 | Final Hardening + V2 Launch |
| **Total** | **914** | |

---

## Sprint 41: Hardening + Budget/TCO Foundations (126h)

### 41.1 - Workspace Prisma Bootstrap + Type Checking Gate (12h, BE/DevOps)

**Files to modify:**
- `package.json` (root) - `postinstall: prisma generate`, typecheck script
- `apps/api/tsconfig.json` — strict include for `*.prisma` stubs if needed
- `.github/workflows/ci.yml` — add gate step

**Implementation:**
- Root-level `prisma generate` (schema at `apps/api/prisma/schema.prisma`) so `@prisma/client` never goes stale
- `npm run typecheck` at workspace root: `tsc -p apps/api/tsconfig.json --noEmit` (existing complaint in `seed-soc2.ts` must be `never`-clean)
- Add gate to CI: typecheck → test → build

---

### 41.2 - CI Test Wiring (16h, DevOps)

**Files to create:**
- `.github/workflows/ci.yml` (if absent) with jobs: lint, typecheck, unit, `nest build`, `next build`
- `apps/e2e/package.json`, Playwright config

**Implementation:**
- Wire Playwright smoke suite (`tests/e2e`) into CI on `master`
- Add k6 regression (`tests/load`) to CI on schedule
- Error on DB/Redis offline at test setup (document startup requirements)

---

### 41.3 - Budget & Forecast Schema (24h, BE)

**Files to create:**
- `apps/api/prisma/migrations/2026xxxxxx_add_budget_models/migration.sql`

**Files to modify:**
- `apps/api/prisma/schema.prisma` — extend existing `BudgetForecast` model

**Implementation / Prisma:**
- Extend `BudgetForecast` with: `budgeted_amount` (Decimal(15,2)), `forecast_amount`, `variance`, `scenario` (String, default "Baseline"), `tco_model` Json (recurring/initial breakdown)
- New related model `BudgetLineItem` (id, tenant_id, forecast_id, category, amount, period) mapped to `budget_line_items`
- Reference existing `ApplicationCost` join for TCO aggregation
- Validation: `budget_forecasts.period` + `application_id` unique per scenario

---

### 41.4 - Budget API (24h, BE)

**Files to create:**
- `apps/api/src/budgets/budgets.module.ts`
- `apps/api/src/budgets/budgets.controller.ts`
- `apps/api/src/budgets/budgets.service.ts`

**Implementation:**
- GET `/budgets` — list by tenant with optional scenario/period filters
- GET `/budgets/:id`
- POST `/budgets` — create with scenario; validate app/capability refs
- PATCH `/budgets/:id`
- DELETE `/budgets/:id` (admin-only)
- POST `/budgets/forecast` — compute next-period forecast (AI-optional in V2.1 edge)
- All writes route through `AuditLog`

---

### 41.5 - Budget UI + TCO Calculator (28h, FE)

**Files to create:**
- `apps/web/src/app/budgets/page.tsx`
- `apps/web/src/app/budgets/[id]/page.tsx`
- components: `budget-form.tsx`, `budget-list.tsx`, `tco-calculator.tsx`

**Implementation:**
- List + detail CRUD surfaces wired to `/api/budgets`
- TCO calculator input: app + license/seats + infra (from `ApplicationCost`) → output: 3-yr projection
- Basic charts (reuse existing chart lib)

---

### 41.6 - Forecast Projection Engine (14h, BE)

**Files to create:**
- `apps/api/src/budgets/forecast.service.ts`

**Implementation:**
- Weighted moving average projection from historical `ApplicationCost`, default 12mo
- Expose `GET /budgets/forecast/{id}`; guard for scenario conflicts

---

### 41.7 - Thin Page Round-out + Feedback Triage (8h, FE)

- Address retrospective item #4: round out 3 thin FE pages (re-check dashboard overrides)
- Capture new customer feedback into `docs/launch/retrospective.md` appendix

---

## Sprint 42: Financial Planning Depth (124h)

### 42.1 - TCO Aggregation API (20h, BE)

**Files to create:**
- `apps/api/src/tco/tco.module.ts/.controller.ts/.service.ts`

**Implementation:**
- POST `/tco/rollup` — aggregate `ApplicationCost` × `Application` × business capability
- Return 3-yr TCO with breakdown by cost_type, currency conversion

---

### 42.2 - Financial Dashboards (24h, FE)

**Files to create:**
- `apps/web/src/app/reports/financial/page.tsx`
- components: `tco-heatmap.tsx`, `spend-by-app.tsx`, `forecast-chart.tsx`

**Implementation:**
- KPI cards (annual spend, renewal runway), top-10 TCO list, forecast chart with scenario toggle

---

### 42.3 - Multi-Year Projection Store (20h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — add `tco_year` fields if needed for projection snapshot

**Implementation:**
- Accept `years=1..5` and persist projection rows to `BudgetForecast` with scenario tag; idempotent

---

### 42.4 - Budget Approval Workflow (24h, FE/BE)

**Files to modify:**
- `apps/api/src/budgets/*` — add approval endpoint
- `apps/web/src/app/budgets/*` — approval UI + submit button

**Implementation:**
- Draft → Submit → Approve/Reject with comments; reuses `WorkflowInstance` when configured, else inline flag

---

### 42.5 - Financial Export (12h, BE/FE)

**Files to modify:**
- `apps/api/src/exports/*` — add `tco` + `budget` templates

**Implementation:** XLSX/CSV export of budget/TCO via existing export pipeline, and PDF summary

---

### 42.6 - TCO What-If Comparator (16h, FE/BE)

**Files to create:**
- `apps/web/src/app/budgets/compare/page.tsx`

**Implementation:** side-by-side scenario comparison; save scenario from comparison

---

### 42.7 - FE Thin Page Round-out (8h, FE)

- Continue thinning gap list; update UI copy from triage

---

## Sprint 43: AI Discovery + Warehouse/BI Adapters (116h)

### 43.1 - AI App→Capability Mapping (26h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — extend `AIRecommendation` with `mapping_context` (Json)
- `apps/api/src/ai/ai.service.ts` — mapping endpoint

**Implementation:**
- `POST /ai/map-app` — input: application id + optional context; returns sklearn/ACTS-based candidate capability
- Confidence + human-approval gate (store approval into `ApplicationCapability`)

---

### 43.2 - Mapping UI (20h, FE)

**Files to create:**
- `apps/web/src/app/ai/mapping/page.tsx`
- components: `mapping-card.tsx`, `approval-flow.tsx`

**Implementation:** batch mapping queue, confidence badges, approve/reject/skip

---

### 43.3 - BI/Warehouse Export Adapters (30h, BE)

**Files to create:**
- `apps/api/src/exports/adapters/snowflake.adapter.ts`
- `apps/api/src/exports/adapters/bigquery.adapter.ts`
- `apps/api/src/exports/adapters/databricks.adapter.ts`
- `apps/api/src/exports/adapters/postgres.adapter.ts`

**Files to modify:**
- `apps/api/src/exports/export.service.ts` — pluggable sink registry

**Implementation:** batch UPSERT into `basemap_applications`, `basemap_capabilities`, `basemap_spend`, `basemap_saas` tables. Credential store via `Tenant.settings` (encrypted). Retry + idempotency keys.

---

### 43.4 - Adapter Config UI (16h, FE)

**Files to create:**
- `apps/web/src/app/integrations/warehouse/page.tsx`

**Configuration:** endpoint + service account upload, test-connection button, map model fields

---

### 43.5 - Schedule + Monitor Syncs (16h, BE)

**Files to modify:**
- `apps/api/src/scheduled-exports/*` — support warehouse sinks

**Implementation:** cron runs per sync template, `ScheduledExport` + `ExportJob` rows, failure alerting

---

### 43.6 - FE Thin Page Round-out (8h, FE)

**Files:** dashboard minor tweaks from triage

---

## Sprint 44: Workflow Automation + Report Digests (116h)

### 44.1 - External Webhook Step (24h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — add `webhook_url`, `webhook_method`, `secret_ref`, `timeout_ms`, `retry_policy` to `WorkflowStep`
- `apps/api/src/workflows/engine.service.ts` — executor for WEBHOOK step

**Implementation:** outbound call to user-configured endpoint; store `WebhookConfig`; retries with backoff; timeouts; webhook success marks step complete

---

### 44.2 - Timer / Wait Step (20h, BE)

**Files to modify:**
- `apps/api/src/workflows/engine/*`

**Implementation:** `WAIT` step with `duration_ms`/cron→enqueue scheduled continuation via existing scheduling primitives

---

### 44.3 - Designer UI for Webhook/Timer (24h, FE)

**Files to modify:**
- `apps/web/src/app/workflows/designer/*`

**Implementation:** drag-drop webhook (fields), timer step (duration), save to schema

---

### 44.4 - Report Digest Subscriptions (24h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — add `digest_channel` (email/slack/webhook) + `digest_cron` to `ScheduledExport`
- `apps/api/src/notifications/*` — digest assembly

**Implementation:** periodic job (daily/weekly) renders report to PDF/digest summary + sends via email or Slack webhook

---

### 44.5 - Digest Subscription UI (14h, FE)

**Files to create:**
- `apps/web/src/app/reports/digests/page.tsx`

**Implementation:** subscribe/unsubscribe, frequency, channel, sample preview

---

### 44.6 - FE Thin Round-out (10h, FE)

---

## Sprint 45: Residency + Compliance Re-validation (118h)

### 45.1 - Regional Residency Enforcement (24h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — add `region`, `residency_region` to `Tenant`, encrypt residency metadata config

**Implementation:** storage-location mapping (EU/US/Asia); enforcement on ingest + export; reject cross-region export when policy set; existing `RetentionPolicy` aligned to residency rules

---

### 45.2 - Residency UI + Policy Compliance (18h, FE)

**Files to create:**
- `apps/web/src/app/settings/residency/page.tsx`

**Implementation:** region selector, policy matrix read-only, export veto notices

---

### 45.3 - Pentest + SOC 2 Type II Re-validation (36h, Security)

**Files to create:**
- `docs/security/pentest-phase6.md`
- (update) `docs/launch/soc2-type2-completion.md`

**Implementation:** schedule vendor pentest window; run ZAP re-scan (targets: new `/budgets`, `/ai`, `/integrations/warehouse` endpoints); SOC 2 Type II evidence refresh for new data-handling surfaces

---

### 45.4 - Multi-Region Settings + Audit Coverage (20h, BE)

**Files to modify:** audit trail covers new residency mutex

---

### 45.5 - Runbook Updates (10h, OPS)

**Files to modify:**
- `docs/ops/runbook.md` — residency ops, failure modes
- `docs/ops/deploy/*` — region labeling in Helm/Compose

---

### 45.6 - FE Round-out (10h, FE)

---

## Sprint 46: RBAC Horizons + SaaS Ingest (122h)

### 46.1 - Recurring Billing Ingest (28h, BE)

**Files to modify:**
- `apps/api/src/integrations/saas/*` — add recurring-billing endpoints (billing → `SaaSApplication` sync), idempotence, upsert

**Implementation:** connect to billing APIs (Stripe-like), match against SaaS app records, shadow-IT flag, `AuditLog`

---

### 46.2 - RBAC Matrix UI (24h, FE)

**Files to create:**
- `apps/web/src/app/admin/rbac/page.tsx`

**Implementation:** matrix grid role × permission, role cloning, preview surfaces; writes via existing `/roles` endpoints

---

### 46.3 - RBAC Approvals + Versioned Roles (24h, BE)

**Files to modify:**
- `apps/api/src/roles/*` — add approval workflow (parent→child), role history/snapshot

**Implementation:** change requests queue + machine-approval policy; audit-trail viewer

---

### 46.4 - SaaS App Detail Pages (12h, FE)

**Round out** app detail, metadata, linked costs, licensing surf

---

### 46.5 - Report Digest (reserve) (14h, BE/FE)

**Implementation:** polish + the digest for SaaS subset

---

### 46.6 - FE Round-out (10h, FE)

---

### 46.7 - Data Quality Report Role (10h, BE)

**Implementation:** schedule DQ scan → report to RoleManager for review

---

## Sprint 47: Mobile Shell + Import Validation (102h)

### 47.1 - Mobile Responsive Shell + PWA (32h, FE)

**Files to create:**
- `apps/web/src/app/mobile` — shared shell, bottom-nav drawer
- `public/manifest.json`, service-worker registration (optional PWA)

**Implementation:** responsive layout at <640px; app-shell nav; offline minimal scaffold; keep scope to top pages (Home, Map, Budgets, Approvals)

### 47.2 - Import Validation + Dry-Run (28h, BE)

**Files to modify:**
- `apps/api/prisma/schema.prisma` — add `validation_status` (draft`/`error/success`) + `dry_run` flag to `ImportJob`
- `apps/api/src/imports/import.service.ts` — pre-flight validator

**Implementation:** row-level compliance (required cols, refs, duplicates) → dry-run report before commit; save CSV/JSON

### 47.3 - Import UI (22h, FE)

**Files to create:**
- `apps/web/src/app/imports/page.tsx`

**Implementation:** upload → dry-run preview (per-row status) → commit; progress + error-rows listing.

### 47.4 - PWA Caching/Offline Behavior (10h, FE)

**Implementation:** service worker caching for read-only views; graceful storage-write queue (optional)

### 47.5 - FE Round-out (10h, FE)

---

## Sprint 48: Final Hardening + V2 Launch (90h)

### 48.1 - Release Regression (32h, QA/BE)

**All new suites:** budgets, TCO, ai/map, warehouse, workflows, digests, residency, RBAC, SaaS ingest, imports; existing 27-page smoke suite consolidated (add budget/import/mobile pages)

### 48.2 - k6 Load + Scale (16h, DevOps)

**Files to modify:** `tests/load/*.k6.js`  cover `/budgets/forecast`, `/ai/mapabilities`, warehouse export

### 48.3 - Docs + Support Update (16h, PM)

**Files to update:** `docs/user-guide.md`, `docs/admin-guide.md`, `apps/docs/swagger` for new endpoints; `docs/support/escalation-path.md` add financial/integrations

### 48.4 - Version Bump + Change Log (10h, PM)

`apps/api`/`apps/web` → **2.0.0**; Helm `appVersion`; CHANGELOG entry; update `docs/launch/launch-announcement.md`

### 48.5 - Go/No-Go Final Sign-off (16h, All)

- Gate **G6** exit (below table); release notes/retrospective; set new backlog from feedback
- Tag `v2.0.0`

---

## Phase 6 Exit Criteria (Gate G6)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G6.1 | V2.1: Budget/TCO (41–42) live and customer-validated; AI mapping (43) used by 1+ tenant | PM |
| G6.2 | Warehouse adapters (43): 3+ sinks configured in production | DevOps |
| G6.3 | Workflow webhook/timer steps fully operational on a customer workflow | FE lead/BE |
| G6.4 | Report digest deliveries scheduled for 3+ tenants | PM |
| G6.5 | Regional residency enforcement tested cross-region | DevOps/Security |
| G6.6 | RBAC matrix UI + approval workflow live; roles versioned | FE lead/BE |
| G6.7 | SaaS recurring billing ingest syncs matching app count | BE |
| G6.8 | Import validation + dry-run shipped; mobile shell PWA pass accessibility | QA |
| G6.9 | All critical+major pentest findings closed; SOC 2 Type II re-stamp clean | Security |
| G6.10 | Type A regression (86 pages + new) green; k6 baseline < 1.5× Phase 5 p95 | QA/DevOps |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Budget modeling scope creep (multi-year curves) | Medium | Medium | Fixed test matrices in Sprint 42; TCO = 3-yr default |
| AI mapping trust / perception issues | Medium | High | Confidence + human-approval before any write |
| Warehouse credentials in config | Medium | High | Encrypt at rest; UI masked; never logs |
| Webhook step creates SSRF | Medium | High | URL allowlist + network egress policy; timeouts/retries |
| Mobile shell costs more than a PWA | Medium | Medium | Strict scope: top-5 pages only, reuse FE components |
| Residency changes break cross-region dev | Low | Medium | Region matrix stub in dev env |
| External pentest availability slips | Medium | Medium | Schedule at Sprint 45 start, have ZAP fallback |

---

*Document version: 2.0 | Last updated: August 2026 | Phase 6 (V2) Sprint Plan*