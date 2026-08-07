# v2 Roadmap

**Sprint 40.6 — Prioritize customer feedback, estimate top 10**

Inputs: customer feedback log (40.1), retrospective action items (40.5), observed gaps from Phases 1–5.

## Feedback themes

1. Deeper financial planning (multi-year budgets, TCO simulation)
2. AI-assisted data discovery & auto-mapping
3. More export/integration targets (SaaS APIs, data warehouses)
4. Advanced threshold/automation in workflows (external webhook steps, timers)
5. Granular RBAC / audit-rich roles and preview surfaces
6. Multi-region data residency controls
7. Mobile-friendly views
8. Report subscription/digest delivery

## Prioritized top 10 (priority ranking)

| # | Feature | Effort | Value | Notes |
|---|---------|--------|-------|-------|
| 1 | Multi-year budget & TCO models | L | H | builds on `budget_forecasts`, `costs` |
| 2 | AI-assisted app-to-capability mapping | M | H | extends `ai-recommendations` |
| 3 | Warehouse/BI export adapters | M | H | extends `exports` |
| 4 | Workflow external-webhook + timer steps | M | M | extends Sprint 37 engine |
| 5 | Regional data residency enforcement | M | H | ties to retention + SaaS residency |
| 6 | Report digest subscriptions (email/Slack) | M | M | builds on `notifications` |
| 7 | RBAC matrix UI + approvals | M | M | extends roles guard |
| 8 | Enhanced SaaS discovery (recurring billing ingest) | M | M | extends `saas_applications` |
| 9 | Mobile responsive shell | L | M | PWA wrapper |
| 10 | Import pipeline validations + dry-run | L | M | extends import jobs |

## Sequencing

- **Milestone V2.1** (items 1–3): financial depth + smarter discovery + integration reach.
- **Milestone V2.2** (4–6): automation and delivery.
- **Milestone V2.3** (7–10): governance surfaces, residency, mobile.

## Estimations

Refer to the effort column (S/M/L) with a standard 16h unit:
- S = 8–16h, M = 16–40h, L = 40–80h.
Efforts are estimates; re-size during sprint planning.

## Acceptance

- Each item enters the normal sprint flow with schema-first models, migration, endpoints, FE surfaces, tests, and update of the relevant guide/doc.