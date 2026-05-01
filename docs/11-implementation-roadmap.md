# Implementation Roadmap

## Overview
This roadmap outlines the phased delivery plan from **zero to full EAM suite**, with a focus on delivering **user value early** and building a solid foundation before adding complexity.

---

## Phase 0: Foundation (Months 1-2) — Setup & Core Infrastructure

### Goal
Stand up the technical foundation, define the data model, and establish development workflows.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Project scaffolding** | Monorepo setup (Next.js + NestJS + Prisma + Docker) |
| 2 | **Database schema** | All core tables from data model, Prisma migrations |
| 3 | **Authentication** | Email/password auth, JWT, session management |
| 4 | **SSO integration** | SAML/OIDC with one IdP (Okta or Azure AD) |
| 5 | **RBAC engine** | Role and permission management, tenant isolation |
| 6 | **Audit logging** | Immutable audit trail on all entity changes |
| 7 | **CI/CD pipeline** | GitHub Actions: lint → test → build → deploy |
| 8 | **Design system** | Component library (shadcn/ui), theming, design tokens |
| 9 | **Global search** | Basic Elasticsearch/Typesense integration |
| 10 | **Import/Export** | CSV/Excel bulk import and export |
| 11 | **Documentation** | API docs (Swagger), architecture docs, runbooks |

### Team

- 1 Full-Stack Lead (architects the foundation)
- 2 Full-Stack Engineers
- 1 DevOps Engineer
- 1 Product Manager

### Success Criteria
- ✅ All developers can run the full stack locally
- ✅ Authentication + RBAC passing security review
- ✅ CI/CD deploys to staging on every PR merge
- ✅ Database migrations are safe and reversible

---

## Phase 1: MVP — Application Portfolio Management (Months 3-5)

### Goal
Deliver a **working Application Portfolio Management** module that users can use daily. This is the foundation of all other modules.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Application CRUD** | Create, read, update, soft-delete applications |
| 2 | **Application detail page** | All metadata fields, tabs for related data |
| 3 | **Application list view** | Sortable, filterable, paginated table with custom views |
| 4 | **Lifecycle management** | State transitions with reason, timeline view |
| 5 | **Application relationships** | Dependency graph, impact analysis |
| 6 | **Cost tracking** | TCO entry, cost breakdown by type, aggregate views |
| 7 | **Technology stack fields** | Tech type, language, framework, OS, cloud provider |
| 8 | **Search & discovery** | Global search, saved filter views |
| 9 | **Executive dashboard** | KPI tiles, health summary, trend sparklines |
| 10 | **Financial dashboard** | Cost by BU, cost by type, top 10 expensive apps |
| 11 | **Risk dashboard** | EOL risk view, lifecycle distribution |
| 12 | **User onboarding** | Guided tour, sample data, empty states |
| 13 | **REST API** | Full CRUD for applications with Swagger docs |
| 14 | **Email notifications** | Lifecycle changes, EOL alerts, comment mentions |

### Team

- 2 Full-Stack Engineers
- 1 Frontend Engineer (dashboards & visualization)
- 1 Product Manager
- 1 QA Engineer

### Success Criteria
- ✅ First customer can onboard and populate their app portfolio
- ✅ Dashboard loads in < 2 seconds
- ✅ 80% of required fields are filled (data quality baseline)
- ✅ Customer interview confirms core workflow works

---

## Phase 2: Capability Mapping + Basic Reports (Months 6-8)

### Goal
Expand the product to include **Business Capability Mapping** and **standard reporting**.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Capability tree editor** | Hierarchical CRUD, drag-and-drop, lock/unlock |
| 2 | **Capability-Application mapping** | Link apps to capabilities with support level |
| 3 | **C2A heatmap** | Matrix visualization, color coding |
| 4 | **Gap analysis** | Auto-flag capabilities with no app support |
| 5 | **Capability ownership** | Assign owners, RACI export |
| 6 | **Standard reports** | Landscape, Cost, EOL, Capability Coverage |
| 7 | **Report builder** | Custom columns, filters, grouping, save/share |
| 8 | **Report scheduling** | Automated delivery via email |
| 9 | **API catalog** | Register APIs, list endpoints, link to apps |
| 10 | **Data lineage (basic)** | Trace data flow between 2-3 systems |
| 11 | **Interface registry** | Document integrations, status, SLA |
| 12 | **Comments & mentions** | Contextual collaboration on any entity |
| 13 | **Audit log UI** | Searchable audit trail for admins |

### Team

- 2 Full-Stack Engineers
- 1 Frontend Engineer
- 1 Product Manager
- 1 QA Engineer

### Success Criteria
- ✅ Customer can map their entire capability model
- ✅ First C2A heatmap generated and shared with stakeholders
- ✅ Standard reports are being used in weekly EA reviews
- ✅ First report is exported to PDF for a board meeting

---

## Phase 3: SaaS Management + Integrations (Months 9-11)

### Goal
Add **SaaS & Cloud Portfolio Management** and **enterprise system integrations**.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **SaaS registry** | Full CRUD with financial, contract, compliance fields |
| 2 | **Seat utilization tracking** | Allocation vs. usage, utilization alerts |
| 3 | **SaaS spend tracking** | Total spend, breakdown by vendor/BU/category |
| 4 | **Contract renewal calendar** | 90/60/30-day alerts |
| 5 | **SaaS approval workflow** | New tool request → IT → Security → Finance approval |
| 6 | **Data import connectors** | Pre-built for ServiceNow, SAP, CSV |
| 7 | **Webhook & API** | External systems can push/pull data |
| 8 | **EOL risk scoring** | Automated risk calculation with alerts |
| 9 | **Technology component inventory** | Servers, databases, cloud services |
| 10 | **Component-app linking** | Link infrastructure to applications |
| 11 | **Cloud readiness scoring** | Assess apps for migration readiness |
| 12 | **Approval workflows** | Configurable multi-step approval workflows |

### Team

- 2 Full-Stack Engineers
- 1 Integration Engineer (connectors)
- 1 Product Manager
- 1 QA Engineer

### Success Criteria
- ✅ Customer can see their full SaaS spend in one place
- ✅ First renewal alert is sent 90 days before contract end
- ✅ ServiceNow connector syncs application data automatically
- ✅ Cloud readiness assessment is completed for top 50 apps

---

## Phase 4: Advanced Analytics & AI (Months 12-15)

### Goal
Add **advanced visualizations**, **self-service analytics**, and **AI-assisted features**.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Self-service query builder** | Visual query interface, cross-entity exploration |
| 2 | **Custom visualizations** | Extended chart library, Sankey, Gantt, treemap |
| 3 | **Transformation roadmap** | Gantt chart, project tracking, milestone view |
| 4 | **Rationalization tracking** | Decision log, savings tracker, before/after metrics |
| 5 | **Data quality management** | Quality scores, rules, trend tracking |
| 6 | **GDPR data flow mapping** | PII tracking, cross-border transfer detection |
| 7 | **Vendor risk management** | Security scorecard, questionnaire, breach alerts |
| 8 | **SaaS discovery** | Auto-detect SaaS from SSO logs |
| 9 | **Shadow IT detection** | Flag unapproved apps, triage workflow |
| 10 | **Duplicate detection** | AI-assisted duplicate app/SaaS identification |
| 11 | **Natural language query** | "Show me the top 10 most expensive apps" |
| 12 | **AI recommendations** | Suggest app consolidations, migration patterns |
| 13 | **Graph database** | Neo4j for complex lineage and dependency queries |
| 14 | **GraphQL API** | Flexible nested queries for advanced consumers |
| 15 | **Weekly digest email** | Automated portfolio health summary |

### Team

- 3 Full-Stack Engineers (one focused on AI/ML)
- 2 Frontend Engineers (visualization specialist)
- 1 Data Engineer (analytics pipelines)
- 1 Product Manager
- 1 QA Engineer

### Success Criteria
- ✅ Self-service analytics is adopted by non-EA personas
- ✅ AI recommendations are reviewed and acted upon
- ✅ Shadow IT discovery finds at least 5 previously unknown apps
- ✅ Transformation roadmap is presented to the board

---

## Phase 5: Scale & Enterprise Features (Months 16-18)

### Goal
Add **enterprise-grade features** to support large organizations and multi-tenant SaaS.

### Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Multi-tenant SaaS** | True tenant isolation, onboarding, billing integration |
| 2 | **On-premise deployment** | Docker Compose, Kubernetes Helm chart |
| 3 | **SSO (additional IdPs)** | Ping, Onelogin, Google Workspace |
| 4 | **Localization** | German, French, Spanish translations |
| 5 | **WCAG 2.1 AA compliance** | Accessibility audit and remediation |
| 6 | **Advanced workflows** | Visual workflow designer, conditional branching |
| 7 | **API rate limiting & quotas** | Per-tenant rate limits, quota management |
| 8 | **SOC 2 Type II audit** | Prepare for and pass compliance audit |
| 9 | **Performance optimization** | Caching, query optimization, CDN for static assets |
| 10 | **Architecture diagrams (C4)** | Drag-and-drop diagram editor |
| 11 | **Technology standards governance** | Define and enforce tech standards |
| 12 | **Capability KPIs** | Track KPIs per capability with trend charts |

### Team

- 2 Full-Stack Engineers
- 1 DevOps Engineer (compliance & infrastructure)
- 1 Accessibility Specialist (contractor)
- 1 Product Manager

### Success Criteria
- ✅ First 3 external customers onboarded via SaaS
- ✅ SOC 2 Type II report available
- ✅ On-premise customer successfully deployed in their data center
- ✅ Platform is accessible (WCAG 2.1 AA compliant)

---

## Roadmap Summary

```
Month:  1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18
        ├────┤├──────────┤├──────────┤├──────────┤├──────────┤├──────────┤├──────────┤├──────────┤
Phase 0: Foundation
Phase 1: APM MVP
Phase 2: Capabilities + Reports
Phase 3: SaaS + Integrations
Phase 4: Advanced Analytics + AI
Phase 5: Enterprise Scale
```

---

## Resource Requirements Summary

| Phase | Engineers | Months | Total Effort |
|-------|-----------|--------|-------------|
| Phase 0 | 4 | 2 | 8 person-months |
| Phase 1 | 4 | 3 | 12 person-months |
| Phase 2 | 4 | 3 | 12 person-months |
| Phase 3 | 5 | 3 | 15 person-months |
| Phase 4 | 7 | 4 | 28 person-months |
| Phase 5 | 5 | 3 | 15 person-months |
| **Total** | | **18** | **90 person-months** |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data model changes mid-build | High | Invest in Phase 0 review, use Prisma migrations |
| Stakeholder alignment delays requirements | Medium | Bi-weekly demo with key stakeholders |
| AI features require more data than available | Medium | Start with rules-based recommendations, add ML in Phase 4 |
| Integrations take longer than expected | Medium | Prioritize ServiceNow, defer SAP to Phase 3 |
| Performance issues with large datasets | High | Early load testing, caching strategy in Phase 0 |
| Scope creep from enterprise features | Medium | Lock MVP scope, track additions via change control |

---

*Previous: [Data Model Design ←](./10-data-model.md) | Next: [Master Index →](./index.md)*
