# BaseMap Admin Guide

**Sprint 39.4 — Administrator documentation**

## Roles & RBAC

BaseMap ships role-based access control scoped to a tenant.

- **Admin** — full CRUD across all modules; access to `/admin/*` routes incl. retention settings and certification reviews.
- **User** — reads and creates in permitted modules.
- Guards, in order, are: **JWT auth** (every API call) then **Admin guard** on privileged controllers.
- Grant/revoke roles from `/users` (tenant-scoped only).

## Tenants & plans

- A tenant is the top-level isolation boundary; every model is scoped by `tenant_id`.
- Plans drive **rate limits** (see API Rate Limiting):
  - `starter` — 100 req/min
  - `pro` — 300 req/min
  - `enterprise` — 1200 req/min
- A custom per-tenant quota can be set via `settings.quotas.requests_per_minute`.

## Integrations

- **SSO** — configure identity provider under Onboarding → SSO Config (OIDC/OAuth2).
- **GraphQL API** — explore at `http://<api>/graphql`.
- **REST API docs** — Swagger UI at `http://<api>/api/docs` (Sprint 39.4).
- **ServiceNow** — config + sync logs for import/export integration.
- **Webhooks** — configure outbound webhook deliveries.

## Compliance & security

- **Access Reviews** — run quarterly access certifications; reviewers confirm/revoke/escalate items; daily 5am cron escalates overdue.
- **Data retention** — `/admin/retention-settings` sets per-entity retention (audit_log 365d, notification/import 90/30d, …); daily 4am purge deletes rows past cutoff.
- **Audit Logs** — immutable record of `create/update/delete/view/login/logout` events.
- **Tech Standards lifecycle** — auto-deprecation and auto-retirement run on a daily 3am cron.
- **Encryption** — see `docs/security/encryption-audit.md`; secrets are stored encrypted (see vault guidance).

## API Rate Limiting

All non-auth traffic is rate limited per tenant (IP fallback) using redis-backed token buckets. Responses carry:

```
X-RateLimit-Limit: <quota>
X-RateLimit-Remaining: <int>
X-RateLimit-Reset: <epoch-seconds>
```

When exhausted the API returns **429 Too Many Requests** with `Retry-After`.

## Operations

See [Runbook](ops/runbook.md) for deploy, rollback, backup/restore, scaling and incident response, and [On-premise](on-premise/installation.md) for self-hosted installs.

## Support handoff

Escalation paths and responsibilities are captured in [Support / escalation](support/escalation-path.md).