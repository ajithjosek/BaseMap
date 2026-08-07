# FAQ

**Sprint 39.5 — Common questions**

## Getting started

**How do I sign in?**
Use the email and password assigned by your admin, or SSO if configured. See the [User Guide](../user-guide.md).

**I can't find the admin settings.**
Admin endpoints are protected by the AdminGuard. Ask your admin to grant your role the necessary access.

**How is my tenant isolated?**
Everything is scoped by `tenant_id`. Users only see their own tenant's data.

## Workflows

**What expressions are supported on `condition` steps?**
Operators `eq, ne, gt, gte, lt, lte, contains, in` combined with `and`/`&&`, `or`/`||`, `not`/`!` and parentheses, e.g. `amount gt 5000 and department eq 'IT'`. Field paths use dots: `form.amount`.

**How do parallel approvals work?**
A `parallel` step fans out into branches and resolves as **all** (every branch approves) or **any** (at least one). Outcomes are logged per branch and reflected in the run trace.

## C4 diagrams

**Can I revert a diagram?**
Yes. Every save creates an immutable snapshot under Version history; select **Restore** to roll the canvas back.

## Tech standards

**How is compliance scored?**
Score = compliant components / total components × 100. A component is compliant when its governing standard is `active` and its version falls in the allowed range. Deprecated/retired or out-of-range standards mark it non-compliant.

**Why is my app flagged?**
At least one component matches a standard that is deprecated, retired, or outside the allowed version range. The application detail page lists which components and why.

**How do standards get retired automatically?**
A daily cron deprecates standards whose `sunset_date` has passed, and retires already-deprecated ones after 90 days.

## Data & API

**How long is data kept?**
Per-entity retention policies are enforced by the daily purge (e.g. `audit_log` 365d). Admins configure it under `/admin/retention-settings`.

**What happens when the rate limit is hit?**
The API returns `429 Too Many Requests` with a `Retry-After` header. Limits scale by plan; wait the indicated seconds before retrying.

## Deployment

**Can I self-host?**
Yes — see `docs/on-premise/installation.md` (Docker Compose / Helm) and `docs/on-premise/backup-restore.md` for disaster recovery.

**Is there an API?**
REST endpoints are documented via Swagger at `/api/docs`, plus a GraphQL endpoint at `/graphql`.