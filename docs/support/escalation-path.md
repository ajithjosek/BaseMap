# Support & Escalation

**Sprint 39.7 — Transition to support**

Ownership handoff, escalation paths, and knowledge base pointers so support engineers can resolve issues without the core engineering team.

## Roles

| Role | Responsibility | Contact |
|------|----------------|---------|
| Support L1 | Triage, FAQs, credentials, common config | `support@` |
| Support L2 | Workflow/standards/config debugging | `support-l2@` |
| Engineering on-call | Code, schema, integration defects | pager/rotation |
| Security officer | Incidents (see IRP) | `security@` |

## Escalation paths

```text
User reports issue
      │
      ▼
L1 support ── answerable ──► resolve within SLA
      │ not answerable
      ▼
L2 support (reproduce + stack trace, tenant, timestamps)
      │ product defect
      ▼
Engineering on-call (bug ticket, deploy fix, backport)
```

- **P0 (service down / data loss / security)** → page engineering immediately, follow the Incident Response Plan; update status page within 15 min.
- **P1 (feature broken for many)** → next business day fix.
- **P2 (minor bug / cosmetic)** → next sprint.
- **P3 (enhancement)** → backlog.

## Tenant context for every ticket

Ask for and include in the ticket:
- Tenant slug/id, plan
- Exact endpoint/route and timestamp (UTC)
- Response headers (`X-RateLimit-*` point at rate-limit issues)
- Screenshot + browser console/network output
- Relevant workflow/standard/diagram IDs

## Knowledge base

| Topic | Doc |
|-------|-----|
| Getting started | `docs/user-guide.md` |
| Admin / RBAC / integration | `docs/admin-guide.md` |
| Deploy/rollback/scale/incident | `docs/ops/runbook.md` |
| On-premise install & DR | `docs/on-premise/*.md` |
| Incident response | `docs/security/incident-response-plan.md` |
| Encryption audit | `docs/security/encryption-audit.md` |
| SOC 2 evidence | `docs/security/evidence-collection-checklist.md` |
| FAQ | `docs/onboarding/faq.md` |
| Demo & sample data | `docs/onboarding/demo-script.md`, `sample-data.md` |

## Support handoff checklist

- [ ] Support aliases provisioned; email routing to ticketing
- [ ] Tenant-context template added to ticketing tool
- [ ] Runbook + IRP printed to knowledge base
- [ ] Monitoring/alerting handoff (API/Redis/Postgres/queue)
- [ ] On-call rotation published
- [ ] One support engineer shadowed a full ticket-to-fix cycle