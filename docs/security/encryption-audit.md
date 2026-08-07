# Encryption & Secret Management Audit

**Status:** Reviewed | **Owner:** Security/DevOps | **Last reviewed:** 2026-08-06

## 1. Objectives

Verify BaseMap meets **TLS 1.3 in transit**, **AES-256 at rest**, and sound
secret-management practices, per SOC 2 (CC6.x) and OWASP ASVS.

## 2. In Transit

| Asset | Requirement | Status |
|-------|-------------|--------|
| Web + API external traffic | TLS 1.3 minimum, TLS 1.2 disabled by 2026 | Expected (terminated at ingress; verify cipher suite) |
| Database connections | TLS required (Postgres `sslmode=require`), no cleartext | Verify in DATABASE_URL + pg client config |
| Redis | SASL/ACL; TLS if not on loopback | Verify |
| Neo4j / Elasticsearch | TLS or network-isolated | Verify |
| Backend-to-backend (internal) | Prefer mTLS or network segmentation | Verify SG policy |

Actions:
- Enforce `sslmode=require` for all Postgres URLs in `.env.*`.
- Terminate TLS 1.3 at the load balancer; disable `TLSv1.0/1.1`.
- Enable HSTS (`Strict-Transport-Security`) with a 6-month max-age preload.

## 3. At Rest

| Category | Requirement | Status |
|----------|-------------|--------|
| Database | AES-256 (PostgreSQL `pgcrypto`/cloud-managed) | Cloud-managed disks |
| Object storage (MinIO/S3) | AES-256 server-side encryption (SSE-KMS preferred) | Enable SSE |
| Backups | Encrypted at rest; restore to encrypted target | Verify |
| Secrets in transit of code | None in repo; env-based | ✅ |

Actions:
- Enable SSE-KMS on MinIO buckets (`exports`, `imports`, `backups`).
- Encrypt pg_dump artifacts before upload.

## 4. Field-Level

- `password_hash` uses bcrypt with cost factor ≥ 10 — ✅ (bcrypt@6).
- SSO `client_secret` values are stored only via encrypted settings, never logged.

## 5. Secret Management

| Item | Recommendation |
|------|----------------|
| Secret storage | Use a vault (AWS Secrets Manager / Azure KV / HashiCorp Vault); not plaintext env |
| Rotation | Rotate DB, Redis, JWT, SSO, Stripe secrets every 90 days and on any exposure |
| JWT signing | Use asymmetric/hardened signing; keep signing key out of client |
| `.env*` | `.env.development/staging/production` are git-tracked for on-prem admin; do NOT include live production secrets |
| Logging | Redact Authorization, passwords, `client_secret`, `DATABASE_URL` in logs |

## 6. Findings & Ownership

| # | Finding | Severity | Owner | Target |
|---|---------|----------|-------|--------|
| 1 | Confirm TLS 1.2 disabled at ingress | High | DevOps | Sprint 39 |
| 2 | Enable SSE-KMS on MinIO buckets | Medium | DevOps | Sprint 38 |
| 3 | Move prod secrets off tracked env files | High | DevOps | Sprint 39 |
| 4 | HSTS + cookie `Secure` flags | Medium | Web | Sprint 38 |

## 7. Verification

- Re-run audit after each change.
- Automated check: `npx sslscan basemap.io` and storage-encryption assertion in CI.