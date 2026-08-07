# Project Close

**Sprint 40.7 — Tag v1.0.0, archive, celebrate**

## Release

- Version bumped to **1.0.0** across `apps/api` and `apps/web` (and Helm `Chart.yaml` already at 1.0.0).
- Git tag `v1.0.0` created on `master`.
- Changelog published (`docs/launch/launch-announcement.md`).

## Archive

Documentation is consolidated and cross-linked:

- **Product / vision**: `docs/01-product-vision.md` … `docs/12-implementation-plan.md`
- **User & admin**: `docs/user-guide.md`, `docs/admin-guide.md`
- **On-premise**: `docs/on-premise/*`
- **Security**: `docs/security/*`
- **Operations**: `docs/ops/runbook.md`
- **Support**: `docs/support/escalation-path.md`
- **Launch**: `docs/launch/*`

## Handover deliverables

- Deployment & sign-off checklist: `docs/launch/deployment-signoff.md`
- Support KB + escalation: `docs/support/escalation-path.md`
- E2E & load suites: `tests/e2e`, `tests/load`
- API docs (Swagger): `/api/docs` (Sprint 39.4)

## Post-close

- Backlog seeded from `docs/launch/v2-roadmap.md`.
- Support rotation published; monitoring/alerts handover per runbook.
- Quarterly: run the retention/certification/sunset cron reviews and the k6 regression gate.

## Celebrate

- Note the 40-sprint journey in the team channel; thank the contributors; ship the retrospective (40.5) and start V2 planning.