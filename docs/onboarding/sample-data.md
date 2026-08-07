# Sample Data

**Sprint 39.5 — Onboarding sample dataset**

Use this to seed an empty tenant for demos and training. Load order matters (parents before children).

## 1. Tenants & users

- One tenant: "Acme Corp", slug `acme`, plan `pro`.
- Two admins + one analyst user in the `user` role.

## 2. Business capabilities

| Level | Name                       | Owner            |
|-------|----------------------------|------------------|
| L1    | Customer Experience        | VP CX            |
| L2    | Order Fulfillment         | Delivery Director|
| L2    | Customer Service          | Support Manager  |
| L3    | Returns & Refunds        | Ops Lead         |

## 3. Applications (8–12)

| Name | Vendor | Lifecycle | Risk |
|------|--------|-----------|------|
| Payments Core | In-house | Active | 72 |
| Order Web | In-house | Active | 45 |
| CRM | Salesforce | Active | 30 |
| ERP | SAP | Retiring | 88 |
| Legacy Billing | In-house | Retiring | 91 |
| Data Lake | Snowflake | Planning | 40 |

## 4. Technology components (12+)

Physically model components and their `component_type` + version so standards scoring has data to compare (e.g. `PostgreSQL 16`, `Node 20`, `Java 11`, `Redis 6`).

Link components to applications via application-components for the Application Components grid.

## 5. Interfaces & dependencies

- Consumer→producer edges between apps (order web → order core, payment → ERP).
- 3+ component dependencies.

## 6. SaaS records + requests

- 4 purchased SaaS (Salesforce, Snowflake, Slack, GitHub).
- 2 in-flight SaaS requests at different approval steps.

## 7. Standards (for compliance scoring)

| Name | Category | Status | Version range |
|------|----------|--------|---------------|
| PostgreSQL | database | active | `>=15` |
| Node.js | language | active | `>=18` |
| Redis | database | active | `*` |
| Legacy Billing | os | deprecated | `=5` |

Ensure at least one component is out-of-range so the "affected applications" and compliance flags light up in the demo.

## 8. Workflow + C4

- A demonstration **workflow** with: start → condition (`amount gt 5000`) → parallel approval (mode `any`) → end.
- A Level 2 **C4 diagram** with a couple of Systems/Containers and one saved snapshot.