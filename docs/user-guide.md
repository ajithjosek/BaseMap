# BaseMap User Guide

**Sprint 39.4 — User documentation**

This guide covers the day-to-day workflows every BaseMap user relies on. Surfaced in-product, the workflows described below map one-to-one to the left navigation.

## Getting started

1. Open the BaseMap URL for your tenant and sign in with your email and password (or SSO if your organization has configured it).
2. On first login, the onboarding wizard walks you through tenant basics (name, brand colors, admin account, SSO) — skip or complete as needed.
3. Pick an area from the left sidebar:
   - **Dashboard** — at-a-glance portfolio overview.
   - **Dashboard Stories** — curated, presentable views.
   - All other items open the corresponding module (see below).

```text
Applications      Capabilities      SaaS & Cloud      Interfaces
Components        EOL Risk          Data Quality      Query Builder
AI Insights       Advanced Analytics  Exports         Resource Allocation
Compliance        Audit Logs        Transformation    Graph Visualization
Reports           Tech Standards   Workflows         C4 Diagrams
```

## Applications

- **View** — `/applications` lists all applications with lifecycle state, risk score, owner, and vendor.
- **Create** — click **New Application**, fill in name/vendor/version, then **Save**.
- **Open** — click a row to see detail: costs, capabilities, components, interfaces, and compliance flags.
- **Deprecated/banned flags** — components governed by a deprecated standard show a warning banner and a compliance badge (see Tech Standards).

## Capabilities

- **View** — `/capabilities` shows the capability tree.
- **Create** — **New Capability**, set name/level/owner.
- **Map apps** — from a capability, map applications to it; coverage is shown in the C2A Heatmap.
- **KPIs** — on capability detail, define KPIs (`/capabilities/kpis`) and record values over time; trends render automatically.

## Reports & graphs

- **Reports** — `/reports` lists saved reports; `/reports/builder` composes custom reports.
- **Graph visualization** — `/graph` renders export/lineage/impact/circular graphs for an app.
- **Exports** — `/exports` generates file exports (JSON/CSV/XLSX/PDF) and schedules recurring exports; large exports run in the background jobqueue and appear under Export Jobs.

## SaaS & cloud

- **SaaS & Cloud** — track purchased SaaS (`/saas`) and in-flight requests (`/saas/requests`).
- **SaaS requests** follow an approval workflow through steps before purchase.

## Workflows

- **Workflows** — `/workflows` design workflow definitions visually (start → approval/condition/parallel/notification → task → end).
- **Run** — click **Run** to execute against a sample context; results show a trace.
- Branches on `condition` steps use the expression language (e.g. `amount gt 5000 and department eq 'IT'`); `parallel` steps fan out approvals resolved as **all** or **any**.

## Tech Standards

- **Tech Standards** — `/tech-standards` summary cards, standards by status pie, and lifecycle.
- Standards move `proposed → in_review → active`, later `deprecated → retired`.
- **Applicability** — version ranges are checked against component versions; non-compliant / deprecated technologies are flagged in the application detail page and component list.
- Compliance affects applications is shown as a drill-down to affected apps.

## C4 diagrams

- **C4 Editor** — `/c4-diagrams` model your architecture at Level 1–4.
- Add Person / System / Container / Component nodes, arrange, then **Save snapshot**.
- Every save creates an immutable **version**; use **Restore** to roll the working canvas back.
- Use Case: keep diagrams in version control for lifecycle, review and audit.

## Data quality, EOL, resource allocation, insights

- **Data Quality** — checks against expectations; highlights records needing attention.
- **EOL Risk** — products near EOL appear with risk scores.
- **Resource Allocation** — plan headcount/budget across capabilities.
- **AI Insights** — generated portfolio recommendations, review and accept to act.

## Need help?

See the **Admin Guide** for tenant configuration, RBAC, and integrations, or open the **FAQ**.