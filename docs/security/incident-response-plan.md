# Incident Response Plan

**Status:** Active | **Owner:** Security Lead | **Last reviewed:** 2026-08-06

## 1. Purpose

Define how BaseMap detects, responds to, contains, and recovers from security
incidents affecting the SaaS platform, on-premise deployments, or customer data.

## 2. Scope

- BaseMap SaaS infrastructure (API, Web, Postgres, Redis, Elasticsearch, Neo4j, MinIO)
- Customer tenant data
- On-premise customer deployments (supporting role)
- Third-party integrations (ServiceNow, OIDC providers, Stripe, email)

## 3. Severity Definitions

| Severity | Definition | Example | Response Time |
|----------|-----------|---------|---------------|
| **SEV-1 Critical** | Active breach or confirmed data exfiltration | Attacker accessing tenant data, RCE, leaked secrets | 15 min |
| **SEV-2 High** | Confirmed compromise without confirmed data loss | Stolen admin session, crypto mining | 1 hour |
| **SEV-3 Medium** | Suspected incident or meaningful impact | DDoS, abuse of API quotas, phishing targeting staff | 4 hours |
| **SEV-4 Low** | Minor issue, no data exposure | Spam, misconfigured dashboard | 1 business day |

## 4. Roles

| Role | Responsibility |
|------|----------------|
| Incident Commander (IC) | Coordinates response, owns timeline, declares severity |
| Technical Lead | Drives containment/eradication, coordinates engineers |
| Security Analyst | Forensics, log review, IOC correlation |
| Communications Lead | Customer/legal/comms notifications |
| Scribe | Records actions, evidence, and timestamps |

## 5. Response Steps

### 5.1 Detection & Triage (0–15 min)
1. Alert sources: audit logs (`/audit-logs`), scheduled scans, rate-limit spikes,
   failed-auth thresholds, SIEM/uptime monitors.
2. Scribe records alert details: time, entity, tenant, action.
3. IC assigns severity and opens a tracking issue with the timeline.

### 5.2 Containment
1. Revoke compromised credentials/sessions (`users.deactivate`).
2. Isolate affected tenant(s): disable tenant feature flags, rotate secrets.
3. Suspend outbound webhooks for affected tenants if exfiltration is suspected.
4. Snapshot affected databases (pg_dump) before any destructive action.

### 5.3 Eradication
1. Remove attacker access paths; rotate all secrets that could have been exposed.
2. Patch vulnerable component; verify with a re-scan.
3. For code-related incidents, revert to last known-good commit and re-deploy.

### 5.4 Recovery
1. Restore from validated backups if integrity is in doubt.
2. Validate data integrity and re-enable affected tenants.
3. Increase monitoring for 30 days after recovery.

### 5.5 Post-Incident
1. Root-cause analysis within 5 business days.
2. Update runbooks, threat model, and this plan.
3. Notify customers/regulators per contract and SOC 2 obligations (72h).

## 6. Escalation Tree

```
Analyst / On-call
   └─ Incident Commander (SEV-3+) 
        ├─ Engineering Lead
        ├─ Security Lead
        └─ CTO / CEO (SEV-1/2 or legal/comms involvement)
```

## 7. Notification Templates

### Customer breach notification (SEV-1/2)
> On [date] BaseMap detected and contained a security incident that may have
> affected data in your workspace [tenant]. We are providing this notice within
> the required timeframe. Actions taken: [containment summary]. We recommend:
> [customer actions]. Contact: [email].

### Internal SEV-1 page
> INC-#### | SEV-1 | [summary] | Owner: [IC] | Started: [ts] | Status: [detecting/containing/eradicated/recovered]

## 8. Evidence Collection

- Preserve logs from: API access logs, audit_log table, rate-limit counters,
  SSO auth events, export/import job records.
- Export evidence with immutable copies (e.g., append-only S3 bucket).
- Chain of custody: document who accessed evidence and when.

## 9. Testing & Review

- Tabletop exercise: quarterly.
- Penetration test results feed severity/threshold reviews: after each engagement.
- Plan review cadence: semi-annual, and after any SEV-2+ incident.
