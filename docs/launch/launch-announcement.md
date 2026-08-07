# Launch Announcement

**Sprint 40.4 — Press/blog post, Product Hunt, website, changelog.**

## v1.0.0 release notes (CHANGELOG)

### Enterprise Application Management, one canvas

BaseMap 1.0 unifies application, capability, technology, and SaaS portfolio management with governance built in.

### Highlights

- **Applications & capabilities** — map apps to business capabilities and visualize coverage in the C2A Heatmap.
- **Technology architecture** — components, dependencies, interfaces, EOL risk, and data quality.
- **SaaS & cloud** — purchased apps, shadow-IT discovery, and an approval request flow.
- **Reporting & analytics** — custom reports, executive dashboards, exports (JSON/CSV/XLSX/PDF), GraphQL + REST APIs.
- **Advanced workflows** — visual designer with conditional branching and parallel approvals (Sprint 37).
- **Tech standards governance** — CRUD, approval lifecycle, auto-retirement, and application compliance scoring (Sprint 38).
- **C4 architecture editor** — Level 1–4 diagrams with versioned snapshots (Sprint 37).
- **Security & compliance** — access certifications, data retention, audit logs, incident response, rate limiting, encryption-at-rest (Phase 5).

### Security

- SOC 2 Type II program in place; audit completion documented in `docs/launch/soc2-type2-completion.md`.
- Encryption at rest + TLS, audit logging, RBAC, Redis-backed rate limiting.

### Compatibility / deployment

- Docker Compose (on-prem, air-gapped) and Helm for Kubernetes — `docs/launch/deployment-signoff.md`.

## Assets to publish

- **Press/blog post** — the release notes above, plus a founder note on the transformation-portfolio journey.
- **Product Hunt** — launch page with screenshots, maker comment, and a demo link.
- **Website update** — bump to "Version 1.0", add security/compliance page, testimonials, and links to `docs/user-guide.md`.
- Share on customer channels during onboarding demos.

## Launch checklist

- [ ] Blog + press release drafted and scheduled
- [ ] Product Hunt listing live
- [ ] Website homepage content updated to v1.0
- [ ] Changelog published (this doc)
- [ ] Mobile/PR images ready