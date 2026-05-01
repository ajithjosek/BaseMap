# EAM Tool — Formal Implementation Plan

> **Document Purpose:** Actionable sprint-by-sprint execution plan for building a LeanIX-style Enterprise Architecture Management platform.  
> **Planning Horizon:** 18 months | **Total Sprints:** 40 (2-week sprints) | **Total Effort:** ~96 person-months  
> **Last Updated:** 2026-04-22

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Path & Dependencies](#2-critical-path--dependencies)
3. [Team Structure](#3-team-structure)
4. [Phase 0: Foundation (Sprints 1–4)](#phase-0-sprints-1--4)
5. [Phase 1: APM MVP (Sprints 5–12)](#phase-1-sprints-5--12)
6. [Phase 2: Capabilities + Reports (Sprints 13–18)](#phase-2-sprints-13--18)
7. [Phase 3: SaaS + Integrations (Sprints 19–24)](#phase-3-sprints-19--24)
8. [Phase 4: Analytics + AI (Sprints 25–32)](#phase-4-sprints-25--32)
9. [Phase 5: Enterprise Scale (Sprints 33–40)](#phase-5-sprints-33--40)
10. [Key Milestones](#10-key-milestones)
11. [Budget & Resource Summary](#11-budget--resource-summary)
12. [Risk Register](#12-risk-register)
13. [Definition of Done](#13-definition-of-done)

---

## 1. Executive Summary

This plan defines a **phased, sprint-based approach** to building a full-featured Enterprise Architecture Management (EAM) tool. The build is organized into **5 phases across 40 sprints** (2 weeks each), delivering a complete LeanIX-style product over **18 months**.

### Build Philosophy

- **Deliver value early:** Phase 1 ships a usable APM product within 5 months
- **Build foundations first:** Phase 0 invests in architecture, auth, and CI/CD before feature development
- **Grow the team with the product:** Team expands from 4 to 7 engineers as complexity grows
- **Validate before scaling:** Each phase ends with customer validation before proceeding

### Phase Overview

```
Sprint:   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
          ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
Phase 0:   ████ Foundation ████
Phase 1:                   ██████████████ APM MVP ██████████████
Phase 2:                                   ████████████ Capabilities + Reports ████████████
Phase 3:                                                   ████████████ SaaS + Integrations ████████████
Phase 4:                                                               ██████████████████ Analytics + AI ██████████████████
Phase 5:                                                                                                           ████████ Enterprise Scale ████████
```

---

## 2. Critical Path & Dependencies

### 2.1 Dependency Graph

```
Phase 0: Foundation
    │
    ├──Sprint 2 complete──→ Phase 1: APM (Sprints 5–12)
    │                              │
    │                              ├──Sprint 12 complete──→ Phase 2: Capabilities + Reports (Sprints 13–18)
    │                              │                                  │
    │                              │                                  └──Sprint 18 complete──→ Phase 4: Analytics + AI
    │                              │
    │                              └──Sprint 12 complete──→ Phase 3: SaaS + Integrations (Sprints 19–24)
    │                                                             │
    │                                                             └──Sprints 19–24 complete──→ Phase 4: Analytics + AI
    │
    └──Sprint 4 complete──→ Phase 5: Enterprise Scale (Sprints 33–40)
                               (can run partially in parallel with Phase 4)

Phase 4: Analytics + AI ──→ Phase 5: Enterprise Scale
```

### 2.2 Gate Criteria (Cannot Proceed Unless...)

| Gate | Checkpoint | Criteria |
|------|------------|----------|
| **G0** | End of Sprint 4 | Full stack runs locally; auth passes security review; CI/CD green |
| **G1** | End of Sprint 12 | Customer can populate portfolio; dashboards < 2s; 80% field completeness |
| **G2** | End of Sprint 18 | Capability model mapped; C2A heatmap generated; board-ready reports |
| **G3** | End of Sprint 24 | SaaS spend visible; ServiceNow sync working; 90-day renewal alerts |
| **G4** | End of Sprint 32 | AI recommendations reviewed; self-service analytics adopted; lineage working |
| **G5** | End of Sprint 40 | SOC 2 report available; 3+ SaaS customers; on-prem deployed |

---

## 3. Team Structure

### 3.1 Roles by Phase

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------|---------|---------|---------|---------|---------|---------|
| **Tech Lead / Architect** | 1 | 1 | 1 | 1 | 1 | 1 |
| **Full-Stack Engineer** | 2 | 2 | 2 | 2 | 2 | 2 |
| **Frontend Engineer** | — | 1 | 1 | 1 | 2 | 1 |
| **Backend/Integration Engineer** | — | — | — | 1 | 1 | 1 |
| **ML/Data Engineer** | — | — | — | — | 1 | — |
| **DevOps Engineer** | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 1 |
| **Product Manager** | 1 | 1 | 1 | 1 | 1 | 1 |
| **QA Engineer** | — | 1 | 1 | 1 | 1 | — |
| **Accessibility Specialist** | — | — | — | — | — | 1* |
| **Security Lead** | — | — | — | — | — | 1* |
| **Total Headcount** | **5** | **6.5** | **6.5** | **7.5** | **9.5** | **8** |

*Contractor roles, not FTE.

### 3.2 Squad Structure

```
┌─────────────────────────────────────────────────────┐
│                    Product Manager                      │
│            (Owns roadmap, priorities, stakeholder comms) │
└─────────────────────────┬───────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐ ┌───────▼──────┐ ┌───────▼──────┐
│  Platform     │ │  Application  │ │  Analytics    │
│  Squad        │ │  Squad       │ │  Squad        │
│               │ │               │ │               │
│ • Auth/RBAC   │ │ • APM module  │ │ • Dashboards  │
│ • Import/Exp  │ │ • Capabilities│ │ • Reports     │
│ • Notifications│ │ • SaaS mgmt  │ │ • AI features │
│ • CI/CD       │ │ • Integrations│ │ • Query builder│
│ • RBAC        │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## Phase 0: Foundation (Sprints 1–4)

**Duration:** Months 1–2 | **Team:** 5 | **Goal:** Stand up the technical platform with no user-facing features.

### Sprint 1: Project Scaffolding

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 1.1 | Set up monorepo (Turborepo or Nx) with apps/web and apps/api | DevOps | Tech Lead | 16 | Monorepo builds successfully |
| 1.2 | Configure Docker Compose (web, api, postgres, redis, elasticsearch) | DevOps | DevOps | 12 | `docker compose up` starts all services |
| 1.3 | Initialize Next.js 14 app with TypeScript and Tailwind CSS | Frontend | FE | 8 | Next.js app runs at localhost:3000 |
| 1.4 | Initialize NestJS API with TypeScript | Backend | BE | 8 | NestJS app runs at localhost:4000 |
| 1.5 | Configure ESLint, Prettier, Husky pre-commit hooks | DevOps | Tech Lead | 4 | Lint passes on pre-commit |
| 1.6 | Set up shared `packages/types` with TypeScript project references | Backend | Tech Lead | 8 | Types can be imported in both apps |
| 1.7 | Set up shadcn/ui component library with design tokens | Frontend | FE | 8 | Button, Input, Card components available |
| 1.8 | Configure environment variables and `.env.example` | DevOps | DevOps | 4 | All secrets documented, none in code |

**Sprint 1 Total:** 68 hours

### Sprint 2: Database & Migrations

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 2.1 | Design and create all core PostgreSQL tables (see Data Model doc) | Backend | Tech Lead | 24 | All tables created with indexes |
| 2.2 | Set up Prisma ORM with schema from database design | Backend | BE | 12 | `prisma generate` succeeds |
| 2.3 | Write Prisma seed script with sample data (10 apps, 20 capabilities) | Backend | BE | 8 | `prisma db seed` populates DB |
| 2.4 | Create Prisma migration scripts for all tables | Backend | Tech Lead | 16 | Migrations are reversible and safe |
| 2.5 | Set up Redis for session store and caching | Backend | BE | 8 | Redis connected and caching works |
| 2.6 | Implement multi-tenant middleware (tenant_id on all queries) | Backend | Tech Lead | 16 | All queries scoped to tenant |
| 2.7 | Set up Elasticsearch index for full-text search | Backend | BE | 12 | Test search returns relevant results |
| 2.8 | Database documentation (schema comments, entity relationships) | Backend | Tech Lead | 8 | Docs match actual schema |

**Sprint 2 Total:** 104 hours

### Sprint 3: Authentication & Authorization

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 3.1 | Implement email/password registration and login | Backend | BE | 16 | User can register, login, receive JWT |
| 3.2 | Implement JWT access tokens (15 min) + refresh tokens (7 days) | Backend | BE | 12 | Tokens issued and validated correctly |
| 3.3 | Implement HttpOnly cookie session management | Backend | BE | 8 | Session persists across requests |
| 3.4 | Implement password reset flow (email link) | Backend | BE | 12 | Reset email sent; password updated |
| 3.5 | Implement RBAC: roles, permissions, user_roles table | Backend | BE | 20 | Admin can assign roles; permissions enforced |
| 3.6 | Implement SAML 2.0 SSO with Okta or Azure AD | Backend | BE | 24 | SSO login works end-to-end |
| 3.7 | Implement just-in-time (JIT) user provisioning from SSO | Backend | BE | 12 | User auto-created on first SSO login |
| 3.8 | Role mapping from IdP groups to platform roles | Backend | BE | 8 | Azure AD group → platform role mapping works |

**Sprint 3 Total:** 112 hours

### Sprint 4: Infrastructure & CI/CD

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 4.1 | Set up GitHub Actions CI pipeline (lint → test → build) | DevOps | DevOps | 16 | PR checks run in < 10 min |
| 4.2 | Configure staging environment deployment | DevOps | DevOps | 16 | Auto-deploy on merge to develop |
| 4.3 | Set up production environment (Kubernetes or ECS) | DevOps | DevOps | 24 | Production deployable via CI/CD |
| 4.4 | Implement immutable audit log on all entity changes | Backend | BE | 16 | All CREATE/UPDATE/DELETE logged |
| 4.5 | Set up Prometheus metrics endpoint on API | Backend | BE | 8 | /metrics endpoint exposes app metrics |
| 4.6 | Set up Grafana dashboards for infrastructure monitoring | DevOps | DevOps | 12 | CPU, memory, request rate visible |
| 4.7 | Set up Sentry error tracking | DevOps | DevOps | 8 | Errors captured with source maps |
| 4.8 | Write runbooks: local setup, deployment, rollback, on-call | DevOps | DevOps | 16 | New developer can run stack in < 30 min |

**Sprint 4 Total:** 116 hours

### Phase 0 Exit Criteria

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G0.1 | `docker compose up` starts full stack locally | All developers |
| G0.2 | User can register, login, and access protected routes | QA |
| G0.3 | SSO login works with Azure AD or Okta | Tech Lead |
| G0.4 | RBAC enforces read/edit restrictions correctly | Tech Lead |
| G0.5 | Audit log captures all entity changes | Tech Lead |
| G0.6 | CI/CD deploys to staging on merge | DevOps |
| G0.7 | Staging is accessible at a public URL | PM |

---

## Phase 1: APM MVP (Sprints 5–12)

**Duration:** Months 3–5 | **Team:** 6.5 | **Goal:** Ship a usable Application Portfolio Management module.

### Sprint 5: Application CRUD

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 5.1 | Application REST API: create, read, update, soft-delete | Backend | BE | 20 | CRUD operations work with tenant isolation |
| 5.2 | Application list page (table with pagination) | Frontend | FE | 16 | List loads < 1s for 1000 apps |
| 5.3 | Application detail page with all metadata fields | Frontend | FE | 16 | All fields editable; changes saved |
| 5.4 | Application creation form with validation (Zod) | Frontend | FE | 12 | Required fields enforced; validation errors clear |
| 5.5 | Global search bar with typeahead (Elasticsearch) | Full-Stack | BE+FE | 16 | Search returns results in < 300ms |
| 5.6 | Link application to business unit (dropdown) | Frontend | FE | 8 | Business unit assigned and displayed |
| 5.7 | Link application to owner (user picker) | Frontend | FE | 8 | Owner assigned and notified |
| 5.8 | Write API integration tests for application endpoints | QA | QA | 12 | All CRUD tests pass |

**Sprint 5 Total:** 108 hours

### Sprint 6: Application List & Filtering

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 6.1 | Multi-column sorting on application list | Frontend | FE | 12 | Sort by name, cost, risk, updated date |
| 6.2 | Advanced filters: lifecycle, BU, owner, tech type, risk | Frontend | FE | 16 | Filters combinable with AND logic |
| 6.3 | Save and name custom filter views | Backend | BE | 12 | Saved views appear for all users with role |
| 6.4 | Column selection (show/hide columns) | Frontend | FE | 8 | User can customize visible columns |
| 6.5 | Bulk actions: update lifecycle, assign owner, delete | Full-Stack | BE+FE | 16 | Bulk update works for up to 100 records |
| 6.6 | Export filtered list to CSV | Backend | BE | 12 | CSV downloads with current filter applied |
| 6.7 | Optimistic UI updates on list actions | Frontend | FE | 8 | UI updates immediately, rolls back on error |
| 6.8 | E2E tests for application list and filtering | QA | QA | 12 | Playwright tests cover key flows |

**Sprint 6 Total:** 96 hours

### Sprint 7: Lifecycle Management

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 7.1 | Lifecycle state machine: Planning → Active → Maintenance → Retirement → Retired | Backend | BE | 16 | Invalid transitions blocked |
| 7.2 | Lifecycle transition form (reason, effective date, approver) | Frontend | FE | 12 | Transition requires reason before saving |
| 7.3 | Visual lifecycle timeline per application | Frontend | FE | 16 | Timeline shows all state changes with dates |
| 7.4 | Lifecycle change notification to stakeholders | Backend | BE | 12 | Email sent to owner and watchers |
| 7.5 | Custom lifecycle stages configuration | Backend | BE | 16 | Org admin can add/remove/reorder stages |
| 7.6 | Block retirement unless prerequisites met (e.g., data migrated) | Backend | BE | 12 | Transition blocked with clear error message |
| 7.7 | Lifecycle distribution chart on dashboard | Frontend | FE | 8 | Pie/bar chart shows count by state |
| 7.8 | Lifecycle transition audit in audit log | Backend | BE | 8 | Every transition logged with old/new state |

**Sprint 7 Total:** 100 hours

### Sprint 8: Cost Tracking

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 8.1 | ApplicationCost table and API (create, read, update) | Backend | BE | 16 | Cost records linked to application |
| 8.2 | Cost entry form: license, infrastructure, support, labor | Frontend | FE | 12 | All cost types supported |
| 8.3 | Cost breakdown chart per application (stacked bar) | Frontend | FE | 12 | Pie shows license vs. infra vs. support |
| 8.4 | Aggregate cost by business unit | Backend | BE | 12 | Sum of all app costs per BU |
| 8.5 | Cost trend chart (monthly over 12 months) | Frontend | FE | 12 | Line chart shows cost over time |
| 8.6 | Cost vs. budget comparison per application | Backend | BE | 12 | Variance (over/under) displayed |
| 8.7 | Total TCO dashboard tile (all apps, all costs) | Frontend | FE | 8 | TCO shown in dashboard |
| 8.8 | Cost data validation (no negative values, required fields) | Backend | BE | 8 | Invalid cost entries rejected |

**Sprint 8 Total:** 92 hours

### Sprint 9: Relationships & Dependency Graph

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 9.1 | Application relationships table and API | Backend | BE | 16 | Create/edit/delete relationships |
| 9.2 | Relationship types: consumes API, shares DB, depends on, provides data | Backend | BE | 12 | All relationship types supported |
| 9.3 | Dependency graph visualization (React Flow) | Frontend | FE | 20 | Graph renders with directed edges |
| 9.4 | Impact analysis: downstream apps if X fails | Frontend | FE | 16 | Traverse graph and list affected apps |
| 9.5 | Circular dependency detection and warning | Backend | BE | 12 | Warning shown when circular dependency found |
| 9.6 | Relationship panel on application detail page | Frontend | FE | 12 | Quick-add relationships from detail page |
| 9.7 | Highlight critical path (longest dependency chain) | Frontend | FE | 8 | Critical path highlighted in red |
| 9.8 | Export dependency graph as PNG/SVG | Frontend | FE | 8 | Graph downloadable for presentations |

**Sprint 9 Total:** 104 hours

### Sprint 10: Dashboards

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 10.1 | Executive dashboard: KPI tiles (app count, active %, at risk, TCO, EOL) | Frontend | FE | 16 | KPI tiles load < 1s |
| 10.2 | Trend sparklines on KPI tiles (12-month history) | Frontend | FE | 12 | Sparklines render inline on tiles |
| 10.3 | Financial dashboard: cost by BU, cost by type, top 10 expensive apps | Frontend | FE | 20 | Charts are interactive (hover tooltips) |
| 10.4 | Risk dashboard: EOL distribution, lifecycle distribution | Frontend | FE | 16 | Traffic light system (red/yellow/green) |
| 10.5 | Role-based default dashboard (CIO, CISO, IT Director views) | Frontend | FE | 16 | User sees relevant dashboard on login |
| 10.6 | Dashboard customization (drag-and-drop widget layout) | Frontend | FE | 20 | Widgets draggable; layout saved per user |
| 10.7 | PDF export of dashboard | Frontend | FE | 12 | Dashboard exports cleanly to PDF |
| 10.8 | Performance: dashboard load time < 2s (p95) | Full-Stack | BE+FE | 8 | Load time verified with Lighthouse |

**Sprint 10 Total:** 120 hours

### Sprint 11: Import/Export & Notifications

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 11.1 | CSV/Excel upload wizard with column mapping UI | Frontend | FE | 20 | User maps columns to fields |
| 11.2 | Bulk import backend: validation, duplicate detection, background processing | Backend | BE | 24 | Large file (> 500 rows) processes in background |
| 11.3 | Import preview with validation error highlighting | Frontend | FE | 12 | Invalid rows shown in red with reason |
| 11.4 | Import completion email with summary report | Backend | BE | 8 | Email sent with row counts and errors |
| 11.5 | Scheduled export (CSV, Excel, JSON) | Backend | BE | 16 | Cron job exports and emails link |
| 11.6 | Notification center: bell icon, unread count | Frontend | FE | 12 | Real-time unread count |
| 11.7 | Lifecycle change notifications (email + in-app) | Backend | BE | 12 | Email + notification on every lifecycle change |
| 11.8 | EOL alert notifications (90, 60, 30 days before) | Backend | BE | 8 | Scheduled job sends EOL alerts |

**Sprint 11 Total:** 112 hours

### Sprint 12: Polish, Onboarding & APM Exit

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 12.1 | Guided onboarding tour for new users | Frontend | FE | 16 | Tour walks through key features |
| 12.2 | Empty states: helpful prompts when no data exists | Frontend | FE | 12 | Empty state suggests next action |
| 12.3 | Sample data seed: realistic demo portfolio (50 apps) | Backend | BE | 8 | Demo data loads with one click |
| 12.4 | Keyboard shortcuts (Cmd+K search, shortcuts for common actions) | Frontend | FE | 12 | Shortcuts documented and working |
| 12.5 | Performance optimization: query tuning, Redis caching | Backend | BE | 16 | Dashboard < 2s, search < 500ms |
| 12.6 | Accessibility check: ARIA labels, keyboard navigation | QA | QA | 12 | WCAG 2.1 AA basic compliance |
| 12.7 | Beta customer onboarding and feedback session | PM | PM | 8 | Customer uses tool; feedback collected |
| 12.8 | Bug bash: fix all P1/P2 bugs from beta | All | All | 16 | Zero P1 bugs; P2 bugs prioritized |

**Sprint 12 Total:** 100 hours

### Phase 1 Exit Criteria (Gate G1)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G1.1 | Customer can create, edit, and manage applications | PM |
| G1.2 | Dashboard loads in < 2 seconds (p95) | QA |
| G1.3 | At least 80% of required fields populated on sample data | QA |
| G1.4 | Bulk import processes 1,000+ row file without failure | QA |
| G1.5 | Lifecycle transitions trigger notifications | QA |
| G1.6 | Dependency graph renders for 50+ connected apps | QA |
| G1.7 | Customer interview: "I can use this daily" | PM |

---

## Phase 2: Capabilities + Reports (Sprints 13–18)

**Duration:** Months 6–8 | **Team:** 6.5 | **Goal:** Business Capability Mapping and standard reporting.

### Sprint 13: Capability Tree CRUD

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 13.1 | CapabilityNode API: create, update, delete with tree validation | Backend | BE | 20 | Cannot create circular parent references |
| 13.2 | Capability tree visualization (recursive tree component) | Frontend | FE | 24 | Tree renders with expand/collapse |
| 13.3 | Drag-and-drop reordering within the tree | Frontend | FE | 20 | Node can be moved to new parent |
| 13.4 | Lock/unlock capability structure | Backend | BE | 8 | Locked nodes cannot be edited by non-admin |
| 13.5 | Import capability model from CSV/Excel | Backend | BE | 16 | Hierarchical parent-child import |
| 13.6 | Level enforcement (max 4 levels, naming conventions) | Backend | BE | 8 | Cannot add 5th level; warning shown |
| 13.7 | Capability detail page: description, owner, importance | Frontend | FE | 12 | All metadata editable |
| 13.8 | Bulk delete with cascade confirmation | Backend | BE | 8 | Warning lists affected child nodes |

**Sprint 13 Total:** 116 hours

### Sprint 14: Application-Capability Mapping

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 14.1 | ApplicationCapability join table and API | Backend | BE | 12 | CRUD for app-capability links |
| 14.2 | Link applications to capabilities from app detail page | Frontend | FE | 16 | Search and select capabilities |
| 14.3 | Support level selector: Primary / Supporting / Enabling | Frontend | FE | 12 | Support level shown on link |
| 14.4 | Capability tree with app count badges | Frontend | FE | 12 | Badge shows # of apps per capability |
| 14.5 | Color-coded coverage: green (covered), yellow (partial), red (gap) | Frontend | FE | 16 | Colors applied based on app coverage |
| 14.6 | Unlink application from capability | Backend | BE | 8 | Removal works without data loss |
| 14.7 | Many-to-many: one app linked to multiple capabilities | Backend | BE | 8 | Verified by testing |
| 14.8 | App-capability link audit trail | Backend | BE | 8 | Changes to links logged |

**Sprint 14 Total:** 92 hours

### Sprint 15: C2A Heatmap & Gap Analysis

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 15.1 | C2A heatmap matrix (capabilities × applications) | Frontend | FE | 24 | Matrix renders; rows/cols are filterable |
| 15.2 | Cell coloring: Primary (dark), Supporting (medium), Enabling (light) | Frontend | FE | 12 | Colors match specification |
| 15.3 | Filter heatmap by business unit, lifecycle, risk level | Frontend | FE | 16 | Filters reduce visible rows/columns |
| 15.4 | Auto-flag capabilities with zero linked applications | Backend | BE | 12 | Gap count shown in dashboard |
| 15.5 | Gap detail page: description, impact, proposed solution | Frontend | FE | 12 | Gap fields are editable |
| 15.6 | Link gap to a project or initiative | Backend | BE | 12 | Gap → project relationship created |
| 15.7 | Gap trend report: gaps opened vs. closed over time | Frontend | FE | 12 | Trend chart shows progress |
| 15.8 | Export heatmap to Excel and PDF | Frontend | FE | 12 | Exports match screen layout |

**Sprint 15 Total:** 112 hours

### Sprint 16: Standard Report Templates

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 16.1 | Report template: Application Landscape Report | Backend | BE | 16 | Template generates with current data |
| 16.2 | Report template: Capability Coverage Report | Backend | BE | 16 | Coverage % calculated per capability |
| 16.3 | Report template: IT Cost Report (TCO breakdown) | Backend | BE | 12 | Cost aggregated by BU, type, vendor |
| 16.4 | Report template: EOL Risk Report | Backend | BE | 12 | Apps sorted by EOL risk level |
| 16.5 | Report parameterization: filter by BU, date range, owner | Backend | BE | 16 | Parameters passed to query |
| 16.6 | PDF export with company branding (logo, colors) | Frontend | FE | 20 | PDF looks professional |
| 16.7 | PowerPoint export for executive summaries | Frontend | FE | 16 | Key charts embedded in slides |
| 16.8 | Report history: last 10 generated reports accessible | Backend | BE | 8 | History table shows generated reports |

**Sprint 16 Total:** 116 hours

### Sprint 17: Custom Report Builder

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 17.1 | Report builder UI: entity selector, column picker | Frontend | FE | 20 | Drag-and-drop column selection |
| 17.2 | Filter builder: add/remove filters with AND/OR logic | Frontend | FE | 20 | Filters combinable |
| 17.3 | Grouping and aggregation: sum, count, avg, min, max | Backend | BE | 16 | Aggregations computed correctly |
| 17.4 | Save and name custom report definitions | Backend | BE | 12 | Reports saved per user or shared |
| 17.5 | Share report with other users or make public | Backend | BE | 12 | Share link or in-app sharing |
| 17.6 | Scheduled report delivery (daily, weekly, monthly email) | Backend | BE | 20 | Cron job sends scheduled reports |
| 17.7 | Excel and CSV export from custom report | Backend | BE | 12 | Export respects current filters |
| 17.8 | Report access control: who can view/edit report definition | Backend | BE | 8 | Permissions enforced |

**Sprint 17 Total:** 120 hours

### Sprint 18: API Catalog & Data Lineage (Basic)

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 18.1 | Interface API: create, read, update, delete | Backend | BE | 16 | CRUD operations work |
| 18.2 | Interface detail: type, source app, target app, protocol, SLA | Frontend | FE | 16 | All fields editable |
| 18.3 | API catalog: searchable registry with filtering | Frontend | FE | 16 | Search by name, type, owner |
| 18.4 | Link APIs to providing and consuming applications | Backend | BE | 12 | App-API relationships bidirectional |
| 18.5 | Basic data lineage: trace data through 2-3 systems | Frontend | FE | 20 | Lineage graph renders |
| 18.6 | Interface health status: operational, degraded, down | Backend | BE | 12 | Status manually updatable |
| 18.7 | Interface incident log | Backend | BE | 8 | Incidents logged with resolution |
| 18.8 | Audit log UI: searchable audit trail | Frontend | FE | 12 | Filter by user, entity, date range |

**Sprint 18 Total:** 112 hours

### Phase 2 Exit Criteria (Gate G2)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G2.1 | Customer can map their entire capability model | PM |
| G2.2 | C2A heatmap renders and is exportable | QA |
| G2.3 | Gap analysis flags capabilities with no app support | QA |
| G2.4 | Standard reports used in weekly EA review meeting | PM |
| G2.5 | First board-ready PDF report exported and presented | PM |
| G2.6 | Custom report builder used by at least 2 non-EA personas | PM |

---

## Phase 3: SaaS + Integrations (Sprints 19–24)

**Duration:** Months 9–11 | **Team:** 7.5 | **Goal:** SaaS management, enterprise connectors, and cloud readiness.

### Sprint 19: SaaS Registry

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 19.1 | SaaSApplication API: CRUD with SaaS-specific fields | Backend | BE | 20 | Full CRUD with all SaaS fields |
| 19.2 | SaaS detail page: vendor, contract, pricing, compliance | Frontend | FE | 20 | All fields displayed and editable |
| 19.3 | Contract renewal calendar view | Frontend | FE | 16 | Calendar shows upcoming renewals |
| 19.4 | Link SaaS app to related on-prem application (if any) | Backend | BE | 12 | Relationship shown on both pages |
| 19.5 | Pricing model: per-user, per-seat, flat fee, usage-based | Backend | BE | 16 | All pricing models supported |
| 19.6 | Compliance certifications tracking (SOC2, ISO27001, GDPR) | Frontend | FE | 12 | Certification badges displayed |
| 19.7 | Data residency field: country/region of data storage | Frontend | FE | 8 | Data residency shown on detail page |
| 19.8 | SaaS spend summary dashboard | Frontend | FE | 12 | Total spend, breakdown by vendor |

**Sprint 19 Total:** 116 hours

### Sprint 20: Seat Utilization & Spend

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 20.1 | Seat fields: total_seats, active_users, last_login_check | Backend | BE | 12 | Fields updatable manually |
| 20.2 | Utilization % calculation and color-coded status | Backend | BE | 12 | Green (70-90%), Yellow (<70%), Red (>90% over) |
| 20.3 | Utilization trend chart per SaaS app | Frontend | FE | 16 | Line chart over 12 months |
| 20.4 | Inactive user export (> 90 days no login) | Backend | BE | 12 | CSV export of inactive users |
| 20.5 | SaaS spend tracking: ACV, monthly spend | Backend | BE | 16 | Spend records with dates |
| 20.6 | Spend breakdown: by vendor, by BU, by category | Backend | BE | 16 | Aggregate queries with grouping |
| 20.7 | Spend trend chart: MoM, YoY | Frontend | FE | 12 | Line chart with comparison |
| 20.8 | Vendor concentration risk: % spend with single vendor | Backend | BE | 8 | Concentration % calculated |

**Sprint 20 Total:** 104 hours

### Sprint 21: Renewal Alerts & Approval Workflow

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 21.1 | Automated renewal alerts: 90, 60, 30 days before contract end | Backend | BE | 16 | Email sent at each milestone |
| 21.2 | New SaaS request form: tool name, vendor, use case, estimated cost | Frontend | FE | 16 | Form collects all required info |
| 21.3 | Approval workflow: requester → IT review → Security → Finance | Backend | BE | 24 | Multi-step workflow enforced |
| 21.4 | Approver notification (email + in-app) | Backend | BE | 12 | Notification sent when action needed |
| 21.5 | Approve/Reject/Request Changes with mandatory comment | Backend | BE | 16 | Rejection requires comment |
| 21.6 | Workflow history: all steps, approvers, timestamps | Backend | BE | 12 | History displayed on request |
| 21.7 | Approved SaaS list auto-updated after approval | Backend | BE | 8 | Approved flag set automatically |
| 21.8 | Annual review trigger for all approved SaaS apps | Backend | BE | 8 | Reminder sent for annual review |

**Sprint 21 Total:** 112 hours

### Sprint 22: ServiceNow Connector

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 22.1 | ServiceNow API client: authenticate and query | Backend | IE | 24 | Connects to ServiceNow instance |
| 22.2 | Application data sync: CMDB → our APM | Backend | IE | 24 | Apps synced from ServiceNow |
| 22.3 | Bidirectional sync option: update source on edit | Backend | IE | 16 | Edit in our app updates ServiceNow |
| 22.4 | Field mapping configuration UI | Frontend | FE | 20 | Admin maps ServiceNow fields to ours |
| 22.5 | Sync scheduling: hourly, daily, weekly | Backend | BE | 12 | Cron configuration |
| 22.6 | Sync log: history of sync operations, errors, record counts | Backend | BE | 12 | Log shows last 100 operations |
| 22.7 | Conflict resolution: which source wins | Backend | BE | 12 | Configurable resolution strategy |
| 22.8 | Error alerting: sync failures trigger notification | Backend | BE | 8 | Alert sent on sync failure |

**Sprint 22 Total:** 128 hours

### Sprint 23: Technology Components & Cloud Readiness

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 23.1 | TechnologyComponent API: CRUD | Backend | BE | 16 | Full CRUD for components |
| 23.2 | Component detail: server, database, cloud service fields | Frontend | FE | 16 | All component types supported |
| 23.3 | Link components to applications | Backend | BE | 12 | Many-to-many relationship |
| 23.4 | Component dependency relationships (tiered architecture) | Backend | BE | 16 | Web → App → Data tier model |
| 23.5 | Cloud readiness scoring: portability, dependency, data residency, security | Backend | BE | 20 | Score calculated from 5 dimensions |
| 23.6 | Cloud readiness assessment UI on application page | Frontend | FE | 16 | Score displayed with breakdown |
| 23.7 | Deployment model field: on-prem, IaaS, PaaS, SaaS, Hybrid | Backend | BE | 8 | Enum field on application |
| 23.8 | Migration complexity estimate: Low, Medium, High | Backend | BE | 8 | Complexity shown on app page |

**Sprint 23 Total:** 112 hours

### Sprint 24: EOL Risk & Phase Exit

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 24.1 | EOL date field on applications and databases | Backend | BE | 8 | EOL date stored and queryable |
| 24.2 | Automated EOL risk score calculation (days remaining × severity) | Backend | BE | 12 | Risk level auto-calculated |
| 24.3 | EOL risk dashboard: Critical/High/Medium/Low counts | Frontend | FE | 12 | Dashboard tiles show counts |
| 24.4 | EOL alert notifications at 12, 6, 3, 1 month | Backend | BE | 12 | Scheduled job sends alerts |
| 24.5 | Link EOL component to migration project | Backend | BE | 8 | Project linked from component |
| 24.6 | Data quality dashboard: completeness by entity, by BU | Frontend | FE | 12 | Quality scores visible |
| 24.7 | Customer demonstration: SaaS spend + renewal calendar | PM | PM | 8 | Demo to key stakeholder |
| 24.8 | Phase 3 bug bash and performance verification | QA | QA | 12 | All P1/P2 bugs fixed |

**Sprint 24 Total:** 84 hours

### Phase 3 Exit Criteria (Gate G3)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G3.1 | Customer sees full SaaS spend in one dashboard | PM |
| G3.2 | First renewal alert sent 90 days before contract end | QA |
| G3.3 | ServiceNow connector syncs at least 500 applications | QA |
| G3.4 | Cloud readiness assessed for top 50 applications | QA |
| G3.5 | EOL risk dashboard shows accurate counts | QA |
| G3.6 | SaaS approval workflow completes end-to-end | PM |

---

## Phase 4: Analytics + AI (Sprints 25–32)

**Duration:** Months 12–15 | **Team:** 9.5 | **Goal:** Self-service analytics, AI features, and graph database.

### Sprint 25: Self-Service Query Builder

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 25.1 | Visual query builder: entity selector → filters → columns | Frontend | FE | 24 | Drag-and-drop query construction |
| 25.2 | Cross-entity queries (applications + capabilities + costs) | Backend | BE | 20 | JOIN queries across entities |
| 25.3 | Chart type selector: table, bar, line, pie, scatter, heatmap | Frontend | FE | 20 | All chart types render |
| 25.4 | Save query as "insight" for reuse | Backend | BE | 12 | Insights saved per user |
| 25.5 | Share insight via link or in-app | Backend | BE | 12 | Share link accessible without login |
| 25.6 | Query result pagination and export | Backend | BE | 12 | Export respects current filters |
| 25.7 | Query performance optimization (< 3s for complex queries) | Backend | BE | 16 | EXPLAIN ANALYZE verified |
| 25.8 | Query history: recent queries accessible | Backend | BE | 8 | Last 20 queries shown |

**Sprint 25 Total:** 124 hours

### Sprint 26: Transformation Roadmap

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 26.1 | Project API: CRUD for migration, decommission, consolidation projects | Backend | BE | 16 | Full project lifecycle |
| 26.2 | Link applications to projects | Backend | BE | 12 | Many-to-many relationship |
| 26.3 | Gantt chart timeline visualization | Frontend | FE | 24 | Timeline with start/end dates |
| 26.4 | Project status tracking: on track, at risk, delayed, completed | Backend | BE | 12 | Status manually updatable |
| 26.5 | Budget utilization per project | Backend | BE | 12 | Spend vs. budget displayed |
| 26.6 | Milestone tracking: planned vs. actual dates | Frontend | FE | 16 | Milestone markers on Gantt |
| 26.7 | Filter roadmap by initiative type, status, owner | Frontend | FE | 12 | Filters applied to Gantt |
| 26.8 | Export roadmap to PowerPoint | Frontend | FE | 12 | PowerPoint slides generated |

**Sprint 26 Total:** 116 hours

### Sprint 27: Rationalization Tracking

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 27.1 | Rationalization decision log: app, decision, date, rationale | Backend | BE | 16 | All decisions recorded |
| 27.2 | Decision funnel: assessed → decision made → action completed | Backend | BE | 16 | Funnel stages tracked |
| 27.3 | Cumulative savings tracker: cost avoided, licenses freed | Backend | BE | 20 | Savings calculated and summed |
| 27.4 | Before/after portfolio metrics comparison | Frontend | FE | 16 | Side-by-side comparison view |
| 27.5 | Business case tracker: projected vs. realized savings | Backend | BE | 16 | Variance between projected and actual |
| 27.6 | Rationalization dashboard: decision rate, savings rate | Frontend | FE | 12 | KPI tiles for rationalization |
| 27.7 | Rationalization report export | Backend | BE | 8 | PDF/Excel export |
| 27.8 | Rationalization scoring matrix (if not done in Sprint 7) | Backend | BE | 12 | 2x2 matrix visualization |

**Sprint 27 Total:** 116 hours

### Sprint 28: SaaS Discovery & Shadow IT

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 28.1 | SSO log parsing for SaaS app detection (Okta, Azure AD) | Backend | BE | 24 | Apps detected from SSO events |
| 28.2 | Auto-detection of new SaaS apps with IT alert | Backend | BE | 16 | Notification sent when new app found |
| 28.3 | Duplicate merging: same app from multiple sources | Backend | BE | 12 | Duplicates merged automatically |
| 28.4 | Shadow IT flagging: unapproved apps highlighted | Backend | BE | 12 | Shadow IT status on SaaS page |
| 28.5 | Shadow IT risk scoring: data sensitivity × users × compliance | Backend | BE | 16 | Risk score calculated |
| 28.6 | Shadow IT dashboard: total unapproved, users at risk | Frontend | FE | 12 | Dashboard tile for shadow IT |
| 28.7 | Triage workflow: approve, block, monitor, migrate | Backend | BE | 16 | Triage actions available |
| 28.8 | Shadow IT trend: month-over-month growth | Frontend | FE | 8 | Trend chart for shadow IT |

**Sprint 28 Total:** 116 hours

### Sprint 29: AI Recommendations

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 29.1 | Duplicate detection: fuzzy name match, shared capabilities | ML | ML | 24 | Clusters of duplicate apps identified |
| 29.2 | Consolidation recommendations: which apps to merge | ML | ML | 24 | Recommendations with estimated savings |
| 29.3 | EOL prioritization: which apps to migrate first | ML | ML | 20 | Prioritized list based on risk + criticality |
| 29.4 | SaaS replacement suggestions: replace app X with alternatives | ML | ML | 20 | Vendor comparisons with pricing |
| 29.5 | Anomaly detection: unusual cost spikes, utilization changes | ML | ML | 16 | Alerts on anomalous patterns |
| 29.6 | AI recommendation UI: cards with explanation and confidence | Frontend | FE | 20 | Recommendations displayed with reasoning |
| 29.7 | Accept/reject recommendation with feedback loop | Backend | BE | 12 | Feedback improves future recommendations |
| 29.8 | AI recommendation summary email (weekly digest) | Backend | BE | 8 | Weekly email with top 5 recommendations |

**Sprint 29 Total:** 144 hours

### Sprint 30: Neo4j Graph Database

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 30.1 | Set up Neo4j instance (Aura or self-hosted) | DevOps | DevOps | 12 | Neo4j accessible |
| 30.2 | Sync PostgreSQL relationships to Neo4j graph | Backend | BE | 24 | App-capability, app-app, app-interface synced |
| 30.3 | Multi-hop lineage queries (3+ systems) | Backend | BE | 20 | Trace data through 3+ hops |
| 30.4 | Impact analysis using graph traversal | Backend | BE | 20 | "If X fails, what breaks?" query |
| 30.5 | Graph visualization: React Flow with Neo4j data | Frontend | FE | 24 | Interactive graph rendered |
| 30.6 | Circular dependency detection at scale | Backend | BE | 12 | Detect cycles in large graphs |
| 30.7 | Graph query performance optimization | Backend | BE | 16 | Queries return in < 1s |
| 30.8 | Graph export to JSON for external tools | Backend | BE | 8 | JSON export of subgraph |

**Sprint 30 Total:** 136 hours

### Sprint 31: Advanced Visualization & GraphQL

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 31.1 | Extended chart library: Sankey, Gantt, treemap, network graph | Frontend | FE | 24 | All chart types functional |
| 31.2 | Dashboard stories: combine charts into presentation | Frontend | FE | 20 | Slide deck within tool |
| 31.3 | Chart annotations: add commentary to any chart | Frontend | FE | 12 | Annotation text on chart |
| 31.4 | GraphQL API: schema, resolvers, queries | Backend | BE | 24 | GraphQL playground accessible |
| 31.5 | GraphQL subscriptions for real-time updates | Backend | BE | 16 | Live updates on dashboard |
| 31.6 | Embed chart in external pages via iframe | Frontend | FE | 12 | Shareable embed code |
| 31.7 | Chart caching: Redis cache for expensive queries | Backend | BE | 12 | Cache TTL: 5 min |
| 31.8 | Weekly digest email: automated portfolio health summary | Backend | BE | 16 | HTML email with key metrics |

**Sprint 31 Total:** 136 hours

### Sprint 32: Performance & Phase Exit

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 32.1 | Database query optimization: EXPLAIN ANALYZE on all slow queries | Backend | BE | 16 | No query > 500ms |
| 32.2 | Redis caching: dashboard tiles, search results, API responses | Backend | BE | 16 | Cache hit rate > 80% |
| 32.3 | CDN setup for static assets | DevOps | DevOps | 12 | Assets served from CDN |
| 32.4 | Load testing: 500 concurrent users | QA | QA | 16 | Performance verified under load |
| 32.5 | Self-service analytics beta: external users test query builder | PM | PM | 8 | Feedback collected |
| 32.6 | AI recommendation review: stakeholder evaluates recommendations | PM | PM | 8 | Recommendations accepted or rejected |
| 32.7 | Transformation roadmap demonstration to leadership | PM | PM | 8 | Roadmap presented at leadership meeting |
| 32.8 | Phase 4 retrospective and Phase 5 planning | All | PM | 8 | Lessons learned documented |

**Sprint 32 Total:** 92 hours

### Phase 4 Exit Criteria (Gate G4)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G4.1 | Self-service query builder used by 3+ non-EA personas | PM |
| G4.2 | AI recommendations reviewed; at least 2 acted upon | PM |
| G4.3 | Shadow IT discovery found 5+ previously unknown apps | QA |
| G4.4 | Neo4j lineage query works for 5-hop traversal | QA |
| G4.5 | Transformation roadmap presented to board | PM |
| G4.6 | Performance: 500 concurrent users with < 2s dashboard load | QA |

---

## Phase 5: Enterprise Scale (Sprints 33–40)

**Duration:** Months 16–18 | **Team:** 8 | **Goal:** Multi-tenancy, compliance, localization, and enterprise readiness.

### Sprint 33: Multi-Tenant SaaS Platform

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 33.1 | Tenant provisioning API: create tenant, assign plan | Backend | BE | 20 | New tenant created with isolated data |
| 33.2 | Tenant onboarding wizard: admin setup, SSO config, branding | Frontend | FE | 20 | Self-service onboarding flow |
| 33.3 | Per-tenant feature flags | Backend | BE | 16 | Features enabled/disabled per plan |
| 33.4 | Per-tenant storage limits and rate limits | Backend | BE | 16 | Limits enforced; overages handled |
| 33.5 | Cross-tenant reporting for SaaS operator | Backend | BE | 16 | Usage metrics per tenant |
| 33.6 | Billing integration stub (Stripe or Chargebee) | Backend | BE | 16 | Subscription created on tenant signup |
| 33.7 | Tenant admin panel: manage own tenant settings | Frontend | FE | 12 | Admin can update tenant config |
| 33.8 | Tenant deletion: data export, data purge workflow | Backend | BE | 12 | GDPR right to erasure supported |

**Sprint 33 Total:** 128 hours

### Sprint 34: On-Premise Deployment

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 34.1 | Docker Compose setup for on-premise (no Kubernetes required) | DevOps | DevOps | 24 | `docker-compose up` runs full stack |
| 34.2 | Helm chart for Kubernetes on-premise deployment | DevOps | DevOps | 24 | Helm install with values.yaml |
| 34.3 | MinIO setup for on-premise object storage | DevOps | DevOps | 12 | MinIO replaces S3 for on-prem |
| 34.4 | Offline installation support: no internet required | DevOps | DevOps | 20 | All images bundled; no external calls |
| 34.5 | Environment-specific configuration (dev, staging, prod) | DevOps | DevOps | 16 | Separate configs per environment |
| 34.6 | On-premise upgrade script: zero-downtime migration | DevOps | DevOps | 20 | Upgrade runs without data loss |
| 34.7 | On-premise documentation: installation, backup, restore, upgrade | DevOps | DevOps | 16 | Admin guide with step-by-step |
| 34.8 | Test on-premise deployment in isolated environment | QA | QA | 12 | Deployment verified in air-gapped env |

**Sprint 34 Total:** 144 hours

### Sprint 35: Localization & Accessibility

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 35.1 | i18n setup: extract all strings to translation files | Frontend | FE | 16 | All UI strings externalized |
| 35.2 | German translation (de-DE) | Frontend | FE | 24 | All strings translated |
| 35.3 | French translation (fr-FR) | Frontend | FE | 24 | All strings translated |
| 35.4 | Spanish translation (es-ES) | Frontend | FE | 24 | All strings translated |
| 35.5 | RTL support infrastructure (for future Arabic/Hebrew) | Frontend | FE | 8 | RTL layout CSS in place |
| 35.6 | WCAG 2.1 AA accessibility audit | QA | A11y | 24 | All critical and major issues found |
| 35.7 | Accessibility remediation: keyboard nav, focus management | Frontend | FE | 32 | All critical issues fixed |
| 35.8 | Screen reader testing (NVDA, VoiceOver) | QA | A11y | 16 | Key flows work with screen reader |

**Sprint 35 Total:** 168 hours

### Sprint 36: Compliance & Security

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 36.1 | SOC 2 Type II gap analysis | Security | Sec | 24 | All gaps identified and documented |
| 36.2 | Access review process: quarterly user access certification | Backend | BE | 16 | Managers certify team access |
| 36.3 | Data retention policy enforcement | Backend | BE | 16 | Old records purged per policy |
| 36.4 | Incident response plan documentation | Security | Sec | 16 | Playbook for security incidents |
| 36.5 | Penetration testing | Security | Sec | 24 | External pentest; findings remediated |
| 36.6 | Encryption audit: verify AES-256 at rest, TLS 1.3 in transit | Security | Sec | 12 | Encryption verified |
| 36.7 | SOC 2 evidence collection and documentation | Security | Sec | 24 | All controls documented |
| 36.8 | SOC 2 readiness assessment with auditor | Security | Sec | 16 | Pre-audit review |

**Sprint 36 Total:** 148 hours

### Sprint 37: Advanced Workflows & C4 Diagrams

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 37.1 | Visual workflow designer: drag-and-drop steps | Frontend | FE | 28 | Steps draggable; arrows connect them |
| 37.2 | Step types: approval, review, notification, webhook | Backend | BE | 24 | All step types functional |
| 37.3 | Conditional branching: step B if approved, step C if rejected | Backend | BE | 20 | Branch logic enforced |
| 37.4 | Parallel approvals: multiple approvers at same step | Backend | BE | 16 | All must approve or configurable |
| 37.5 | C4 diagram editor: drag-and-drop shapes | Frontend | FE | 28 | Context, Container, Component levels |
| 37.6 | C4 diagram versioning: save, compare, restore | Backend | BE | 12 | Version history available |
| 37.7 | Link diagram elements to actual entity records | Backend | BE | 16 | Clicking element opens entity detail |
| 37.8 | C4 export to PNG, SVG, PDF | Frontend | FE | 12 | Diagram downloadable |

**Sprint 37 Total:** 156 hours

### Sprint 38: Technology Standards Governance

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 38.1 | Technology standard definitions: allowed, preferred, deprecated, banned | Backend | BE | 16 | Standard CRUD operations |
| 38.2 | Standard categories: language, database, OS, cloud, framework | Backend | BE | 12 | Categories managed separately |
| 38.3 | Application compliance scoring: % of tech stack meeting standards | Backend | BE | 20 | Score calculated per application |
| 38.4 | Flag applications using deprecated/banned technologies | Backend | BE | 12 | Warning shown on app page |
| 38.5 | Standards approval workflow: propose → review → approve/reject | Backend | BE | 20 | Full proposal workflow |
| 38.6 | Standards lifecycle: proposed → active → deprecated → retired | Backend | BE | 12 | Lifecycle state machine |
| 38.7 | Technology standards dashboard | Frontend | FE | 12 | Compliance summary visible |
| 38.8 | Capability KPI tracking: custom KPIs per capability | Backend | BE | 20 | KPI definitions and values stored |

**Sprint 38 Total:** 124 hours

### Sprint 39: Final Hardening & Documentation

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 39.1 | API rate limiting: per-tenant quotas | Backend | BE | 16 | Rate limits enforced; 429 returned |
| 39.2 | Performance regression testing | QA | QA | 16 | All performance targets verified |
| 39.3 | Security regression testing | Security | Sec | 16 | No regressions from pentest fixes |
| 39.4 | End-to-end test suite: critical paths covered | QA | QA | 24 | Playwright tests for all epics |
| 39.5 | User documentation: admin guide, user guide, API docs | Tech Lead | PM | 24 | Docs hosted at docs.basenap.com |
| 39.6 | Launch readiness checklist | PM | PM | 8 | All gate criteria verified |
| 39.7 | Onboarding materials: demo scripts, sample data | PM | PM | 12 | Sales team trained |
| 39.8 | Runbook update: final operational procedures | DevOps | DevOps | 12 | Runbooks reviewed and updated |

**Sprint 39 Total:** 128 hours

### Sprint 40: Launch & Handoff

| # | Task | Type | Owner | Hours | Acceptance |
|---|------|------|-------|-------|------------|
| 40.1 | First 3 SaaS customers onboarded and live | PM | PM | 16 | Customers using product daily |
| 40.2 | On-premise customer deployment (if applicable) | DevOps | DevOps | 16 | Customer successfully deployed |
| 40.3 | SOC 2 Type II audit completion | Security | Sec | 16 | Audit passed; report available |
| 40.4 | Launch announcement and marketing materials | PM | PM | 8 | Press release, website updated |
| 40.5 | Transition to support and operations | All | All | 16 | Knowledge transfer complete |
| 40.6 | Post-launch retrospective: lessons learned, backlog for v2 | All | PM | 12 | Retrospective documented |
| 40.7 | v2 roadmap planning: prioritization based on launch feedback | PM | PM | 16 | Roadmap for next 6 months |
| 40.8 | Final project close: archive artifacts, celebrate team | PM | PM | 8 | Project officially closed |

**Sprint 40 Total:** 108 hours

### Phase 5 Exit Criteria (Gate G5)

| Gate | Criteria | Verified By |
|------|----------|-------------|
| G5.1 | 3+ SaaS customers live and using product daily | PM |
| G5.2 | On-premise customer successfully deployed | DevOps |
| G5.3 | SOC 2 Type II report available | Security |
| G5.4 | Platform passes WCAG 2.1 AA accessibility audit | QA |
| G5.5 | All critical and major security findings resolved | Security |
| G5.6 | User documentation and API docs complete | PM |

---

## 10. Key Milestones

| Month | Milestone | Phase | Deliverable |
|-------|-----------|-------|-------------|
| **M2** | Foundation Complete | Phase 0 | Full stack runs; auth; CI/CD green |
| **M5** | APM MVP Live | Phase 1 | Customer can use APM daily |
| **M8** | Capability + Reports Live | Phase 2 | Board-ready reports; C2A heatmap |
| **M11** | SaaS + Integrations Live | Phase 3 | ServiceNow sync; SaaS spend visible |
| **M15** | Analytics + AI Live | Phase 4 | Self-service analytics; AI recommendations |
| **M18** | Enterprise Launch | Phase 5 | SOC 2; multi-tenant; on-prem ready |

---

## 11. Budget & Resource Summary

### 11.1 Effort by Phase

| Phase | Months | Team Size | Person-Months | Avg. Monthly Cost* |
|-------|--------|-----------|---------------|--------------------|
| Phase 0 | 2 | 5 | 10 | $75,000 |
| Phase 1 | 3 | 6.5 | 19.5 | $97,500 |
| Phase 2 | 3 | 6.5 | 19.5 | $97,500 |
| Phase 3 | 3 | 7.5 | 22.5 | $112,500 |
| Phase 4 | 4 | 9.5 | 38 | $142,500 |
| Phase 5 | 3 | 8 | 24 | $120,000 |
| **Total** | **18** | | **133.5** | **$645,000** |

*Assumes blended average fully-loaded engineering cost of $15,000/month per person. Adjust based on your actual cost structure.

### 11.2 Infrastructure Cost Estimates (Monthly)

| Service | MVP (Phase 1) | Production (Phase 5) |
|---------|---------------|----------------------|
| Cloud compute (3-tier) | $500/month | $3,000/month |
| Database (PostgreSQL managed) | $100/month | $500/month |
| Redis + Elasticsearch | $150/month | $400/month |
| Object storage (S3) | $20/month | $100/month |
| CDN + WAF | $50/month | $200/month |
| Monitoring + logging | $50/month | $300/month |
| **Total infra/month** | **~$870** | **~$4,500** |
| **Total infra/18 months** | | **~$65,000** |

---

## 12. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|-------------|--------|------------|-------|
| **R1** | Data model changes mid-build (schema changes cascade) | High | High | Invest 2 weeks in Phase 0 schema review; Prisma migrations tested | Tech Lead |
| **R2** | Stakeholder alignment delays requirements | Medium | Medium | Bi-weekly demos; change control board for scope | PM |
| **R3** | AI features require more labeled data than available | Medium | Medium | Phase 1-3 build labeled dataset; Phase 4 starts with rules-based | ML Engineer |
| **R4** | ServiceNow integration complexity underestimated | Medium | Medium | Prototype connector in Sprint 22; spike first | Integration Eng |
| **R5** | Performance issues with 10K+ applications | Medium | High | Load test from Sprint 5; caching strategy in Phase 0 | Tech Lead |
| **R6** | SOC 2 audit reveals critical findings | Low | High | Engage auditor in Sprint 30; continuous compliance monitoring | Security Lead |
| **R7** | Key engineer leaves mid-project | Low | High | Cross-train; document decisions; avoid single points of failure | Tech Lead |
| **R8** | Scope creep from enterprise feature requests | High | Medium | Lock MVP scope; all additions via change control | PM |

---

## 13. Definition of Done

Each task is considered **Done** when ALL of the following are true:

| Category | Criteria |
|----------|----------|
| **Code** | Code written, reviewed, and merged to main |
| **Tests** | Unit tests ≥ 80% coverage; integration tests pass; E2E tests pass |
| **Documentation** | API docs updated; user-facing changes documented |
| **QA** | Tested in staging environment; no P1 or P2 bugs open |
| **Performance** | Meets performance targets (dashboard < 2s, API < 300ms) |
| **Security** | No critical or high security findings; input validation in place |
| **Accessibility** | WCAG 2.1 AA basic compliance (Phase 5: full compliance) |
| **Demo** | Feature demonstrated to PM and accepted |

---

## Appendix: Sprint Velocity Tracking

| Phase | Sprints | Planned Hours | Actual Hours | Velocity | Notes |
|-------|---------|--------------|--------------|----------|-------|
| Phase 0 | S1–S4 | 400 | (track in sprint) | — | Foundation; expect overruns |
| Phase 1 | S5–S12 | 856 | | | APM MVP |
| Phase 2 | S13–S18 | 668 | | | Capabilities |
| Phase 3 | S19–S24 | 656 | | | SaaS |
| Phase 4 | S25–S32 | 964 | | | Analytics |
| Phase 5 | S33–S40 | 976 | | | Enterprise |
| **Total** | **S1–S40** | **4,520** | | | **18 months** |

---

*Document version: 1.0 | Author: Generated from EAM Feature Specification | Status: Ready for Review*
