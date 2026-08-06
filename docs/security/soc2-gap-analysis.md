# SOC 2 Gap Analysis (Sprint 33.7)

> **Status:** Draft — initial gap analysis
> **Owner:** Security Team
> **Related seed:** `apps/api/prisma/seed-soc2.ts`
> **Target:** SOC 2 Type II (attestation in Sprint 40)

## Objective

Map BaseMap's existing security controls against the SOC 2 Trust Services
Criteria (TSC). Identify gaps, remediation timeline, and evidence collection
requirements. SOC 2 Type II requires a 12-month observation period, so the
analysis begins early in Phase 5 (Sprint 33).

## Trust Services Criteria Coverage

| Category | Scope in BaseMap | Current State |
|----------|------------------|---------------|
| CC - Common Criteria | Controls environment, access, change mgmt, monitoring | Partial - RBAC and auth exist |
| A - Availability | Uptime, backup, DR | Partial - Docker env, no formal DRP |
| C - Confidentiality | Data classification, encryption | Partial - HTTPS, encryption at rest |
| P - Privacy | PII consent, retention | Gap - no retention policy |

## Controls Assessment (subset)

Seed `seed-soc2.ts` maps 20 representative controls with an initial status.
Reference the full list via the compliance framework seeded for each tenant.

| Control | Criteria | Status | Platform Evidence | Gap / Action |
|---------|----------|--------|-------------------|--------------|
| CC6.1 | Logical access | Compliant | JWT auth, `x-tenant-id` isolation, `TenantMiddleware` | Complete SSO - Sprint 33 |
| CC6.2 | User registration | Gap | `auth/register` + SSO JIT provisioning | Add termination/de-reg flow - Sprint 36 |
| CC6.3 | Least privilege | Compliant | `Role` / `UserRole` / `Permissions` models | - |
| CC6.6 | Access rejection | Compliant | `AdminGuard` on privileged routes | - |
| CC7.2 | Incident response | Gap | - | Write IRP - Sprint 36 |
| CC8.1 | Change management | Compliant | CI/CD (turbo, Docker), versioned migrations | - |
| A1.2 | Backup/recovery | Gap | Postgres/Redis in compose | DR runbook - Sprint 39 |
| C1.2 / PI1.4 | Encryption / retention | Gap | TLS, DB encryption | Retention policy - Sprint 36 |

## Key Gaps

1. **Incident Response Plan** (CC7.1/CC7.2) - no document. → Sprint 36
2. **Access review / certification** (CC6.2) - no quarterly review process. → Sprint 36
3. **Data retention policy** (PI1.4) - no automated purging. → Sprint 36
4. **Disaster recovery plan** (A1.2/A1.3) - backup test runbook missing. → Sprint 36
5. **Penetration testing** evidence. → Sprint 36

## Remediation Timeline

| Milestone | Sprint | Evidence Needed | Owner |
|-----------|--------|-----------------|-------|
| Complete SSO + admin guard audit trail | 33 | Config, logs | Security Team |
| Feature flags / rate limits operational | 33 | Config, headers | Platform |
| IRP written & tested | 36 | Playbook, tabletop results | Security Team |
| Access certification process | 36 | Workflow, sign-off records | Security Team |
| Data retention & selective erasure | 36 | Policy, batch logs | Security Team |
| Pen test (ZAP / external) | 36 | Scan reports, remediation | Security Team |
| SOC 2 Type II audit | 40 | Full evidence package | External Auditor |

## Evidence Collection Checklist

Per control, collect:
- Architecture / config snapshots
- App + API source references (already in repo)
- CI pipeline definitions (`turbo.json`, Dockerfiles)
- Audit log samples (from `AuditLog` table)
- Screenshots of admin panels (feature flags, RBAC)

## Instructions to Run the Seed

```
cd apps/api
npx prisma db seed   # ensure base seed ran (creates a tenant + admin user)
node --env-file=../../.env ../node_modules/tsx/dist/cli.mjs prisma/seed-soc2.ts
```

This creates a `SOC 2` compliance framework with 20 controls for the first
tenant and sets a percentage score reflecting current compliance. Iterate the
`resolveStatus()` mapping as controls are implemented.