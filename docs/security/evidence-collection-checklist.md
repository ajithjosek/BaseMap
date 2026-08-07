# SOC 2 Evidence Collection Checklist

**Status:** In progress | **Owner:** Security | **Target:** Type II audit (Sprint 40)

Collect evidence against the trust service criteria. Each control in the
`ComplianceControl` table (`compliance_frameworks` + `compliance_controls`)
should have `status`, `evidence` (pointer or summary), `owner`, and `due_date`
updated.

## 1. General Controls (CC)

| Criterion | Evidence Needed | Source |
|-----------|----------------|--------|
| CC1 – Control environment | Org chart, code-of-conduct, board approvals | HR/PM |
| CC2 – Communication | Incident/notification policies, customer comms templates | docs/security/incident-response-plan.md |
| CC4 – Monitoring | Audit log retention config, monitoring dashboards, alert screenshots | /admin/retention-settings, Grafana |
| CC5 – Risk assessment | Threat model, risk register | Security |
| CC6 – Logical access | SSO config, RBAC matrix, access certification cycles | /certifications, users module |
| CC7 – System operations | Backup/restore runbooks, change management process | docs/on-premise/*, runbook |
| CC8 – Change management | CI/CD pipeline configs, code review policy | Engineering |
| CC9 – Risk mitigation | Vendor due-diligence, DPA records | Procurement |

## 2. Common Criteria Evidence Formats

- **Configs**: sanitized `.env.*`, compose files, nginx/TLS configs.
- **Screenshots**: access-control matrix, MFA enforcement, audit-log viewer,
  retention policy page, SSO configuration page.
- **Logs**: sample audit_log rows, export/import job logs (PII-scrubbed).
- **Reports**: quarterly access certification summary, retention purge report.

## 3. Required SOC 2 Security Measures (checklist)

- [ ] MFA enforced for all platform admins (OIDC with MFA provider)
- [ ] Quarterly access reviews completed and documented
- [ ] Data retention policies configured and purge job verified
- [ ] TLS 1.3 in transit, AES-256 at rest verified
- [ ] Backup/restore drill performed (last 6 months)
- [ ] Incident response tabletop executed (last 12 months)
- [ ] Penetration test completed, Critical/High remediated
- [ ] Vendor DPA + BAA on file

## 4. Tracking

Update each `ComplianceControl` row:
- `status` ∈ {compliant, non_compliant, in_progress, not_applicable}
- `evidence` → pointer to the artifact above
- `last_reviewed` → date evidence was last validated

Progress is visible on the Compliance page (`/compliance`) per framework.
