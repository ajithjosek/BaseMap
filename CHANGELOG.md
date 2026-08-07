# Changelog

All notable changes to BaseMap.

## [1.0.0] — Launch

### Added
- **Phase 5 (36–40):** access reviews, data retention, incident response/encryption/evidence docs, on-premise guides.
- **Sprint 37 — workflows & C4:** visual workflow designer, conditional-branching evaluator, parallel approvals, C4 diagram editor with versioned snapshots.
- **Sprint 38 — standards & throttling:** technology standards governance (CRUD, categories, approval workflow, lifecycle auto-retirement, compliance scoring) and capability KPI tracking, Redis-backed rate limiting.
- **Sprint 39 — hardening:** Swagger API docs (`/api/docs`), Playwright E2E suite, k6 performance regression, user/admin guides, ops runbook, onboarding & support materials.
- **Sprint 35 — i18n:** expanded locales (EN/PT-BR/DE/FR/ES) and RTL support.
- **Sprint 36 — compliance:** access certification reviews, retention policies, security & on-premise documentation (earlier commits).

### Changed
- Version bumped to 1.0.0 (`apps/api`, `apps/web`); Helm chart `1.0.0`/`appVersion 1.0.0`.

### Documentation
- `docs/user-guide.md`, `docs/admin-guide.md`, `docs/ops/runbook.md`, `docs/support/`, `docs/launch/`.

## [0.9.0] — Phase 5 (pre-launch)

Sprint 35: cross-tenant reporting, RTL + new locales.

## [0.x] — Phases 1–4

Core APM modules: applications, capabilities, technology architecture, SaaS/cloud, reporting/analytics, data quality, EOL risk, integrations (GraphQL, ServiceNow, webhooks), RBAC/tenants/billing.