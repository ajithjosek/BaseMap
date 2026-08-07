# Onboarding Runbook — First Customers

**Sprint 40.1 — Provision tenants, SSO, demo, feedback**

## Tenant provisioning

1. Create the tenant via the admin/seed flow (or DB): name, slug, plan.
   - Plans: `starter` (100 req/min), `pro` (300), `enterprise` (1200).
2. Create the tenant admin + analyst users.
3. Confirm `tenant_id` isolation: users belong to that tenant; all queries are scoped.
4. Optional per-tenant custom rate quota: `settings.quotas.requests_per_minute`.

## SSO setup

- Under **Onboarding → SSO Config**, register the identity provider (OIDC/OAuth2).
- Provide the callback URL to the customer's IT team; verify a test login.
- Fallback: email+password auth remains available.

## Guided demo (use `docs/onboarding/demo-script.md`)

1. Load [sample data](docs/onboarding/sample-data.md) for a sandbox tenant.
2. Run the ~10 min demo (dashboard → apps → capabilities → graph → reports → workflows → C4 → governance).
3. Walk through the customer's own data-collection pain points; show imports + ServiceNow sync.

## Collect feedback

Log every session:

| Date | Customer | Tenant | Plan | Highlights | Concerns | Follow-ups |
|------|----------|--------|------|-----------|----------|------------|
|      |          |        |      |           |          |            |

- Capture the two biggest blockers per customer and route to the v2 roadmap (`docs/launch/v2-roadmap.md`).
- Track NPS-style rating (0–10) per demo.

## Sign-off log

- [ ] Tenant provisioned + tested
- [ ] SSO verified end-to-end
- [ ] Demo delivered, feedback recorded
- [ ] Sample data loaded
- [ ] Support/onboarding contacts exchanged (see `docs/support/escalation-path.md`)