# Module 6: Reports, Dashboards & Analytics

## Overview
This module provides **actionable insights** across the entire enterprise architecture landscape. It transforms raw EA data into executive-readable reports, operational dashboards, and self-service analytics—serving audiences from the C-suite to day-to-day application owners.

---

## Epic 7.1: Executive Dashboards

### User Story 7.1.1
**As a** Chief Enterprise Architect / CIO,  
**I want to** view a high-level landscape health dashboard on login,  
**so that** I can quickly assess the overall state of the IT portfolio.

**Acceptance Criteria:**
- [ ] KPI tiles: total applications, % in Active state, applications at risk, total IT cost, EOL count
- [ ] Traffic light summary: portfolio health by lifecycle state
- [ ] Trend sparklines: app count, cost, risk over last 12 months
- [ ] Quick links: top 5 actions needed, upcoming renewals, overdue reviews
- [ ] Customizable widget layout (drag-and-drop)
- [ ] Role-based default dashboard: CIO sees financial & strategic, CISO sees risk, IT Director sees operational

**Priority: MUST-HAVE (MVP)**

---

### User Story 7.1.2
**As a** CFO,  
**I want to** view a financial overview dashboard showing IT cost distribution and trends,  
**so that** I can report on IT spend to the board.

**Acceptance Criteria:**
- [ ] Total TCO breakdown by cost type (license, infrastructure, support, labor)
- [ ] Cost by business unit chart (bar chart)
- [ ] Cost by technology type (pie chart)
- [ ] Month-over-month cost trend (line chart)
- [ ] Top 10 most expensive applications
- [ ] Cost vs. budget comparison
- [ ] Export dashboard to PDF for board presentations

**Priority: MUST-HAVE (MVP)**

---

### User Story 7.1.3
**As a** CISO,  
**I want to** view a risk and security dashboard showing the exposure across the portfolio,  
**so that** I can prioritize security remediation efforts.

**Acceptance Criteria:**
- [ ] Risk distribution: Critical / High / Medium / Low counts
- [ ] Applications by EOL risk level
- [ ] Applications with open vulnerabilities
- [ ] Security compliance score (avg. security fields completed)
- [ ] SaaS apps without SOC 2 / GDPR compliance
- [ ] Trend: risk score improvement over time

**Priority: MUST-HAVE (MVP)**

---

## Epic 7.2: Pre-Built Standard Reports

### User Story 7.2.1
**As an** Enterprise Architect,  
**I want to** generate and export standard EA reports,  
**so that** I can share portfolio information with stakeholders in a professional format.

**Acceptance Criteria:**
- [ ] Report templates: Application Landscape Report, Capability Coverage Report, IT Cost Report, EOL Risk Report, Data Flow Report, SaaS Portfolio Report
- [ ] Parameterized reports: filter by business unit, date range, owner, risk level
- [ ] Export formats: PDF, PowerPoint, Excel, CSV
- [ ] Report scheduling: daily, weekly, monthly — delivered to email
- [ ] Report history: last 10 generated reports accessible
- [ ] Custom branding: company logo, color scheme on exported PDFs

**Priority: MUST-HAVE (MVP)**

---

### User Story 7.2.2
**As an** Enterprise Architect,  
**I want to** create and save custom reports with my own column selection, filters, and grouping,  
**so that** I can build stakeholder-specific reports without IT involvement.

**Acceptance Criteria:**
- [ ] Report builder: drag-and-drop column selection from entity list
- [ ] Filters: add/remove filters with AND/OR logic
- [ ] Grouping: group by any column (business unit, lifecycle, owner)
- [ ] Aggregations: sum, count, average, min, max
- [ ] Sort and subtotals
- [ ] Save report definition for reuse
- [ ] Share report with other users or make public

**Priority: MUST-HAVE (MVP)**

---

## Epic 7.3: Self-Service Analytics & Ad-Hoc Queries

### User Story 7.3.1
**As a** Business Analyst,  
**I want to** explore data using an interactive query interface,  
**so that** I can answer business questions without writing SQL or filing a ticket.

**Acceptance Criteria:**
- [ ] Visual query builder: select entity → add filters → choose columns → apply grouping
- [ ] Chart type selection: table, bar, line, pie, scatter, heatmap
- [ ] Cross-entity queries: e.g., "Show apps with highest cost that are mapped to capability X"
- [ ] Query result pagination and export
- [ ] Save query as "insight" for reuse
- [ ] Natural language query (Phase 2): "What are the top 10 most expensive applications?"

**Priority: SHOULD-HAVE (MVP+)**

---

### User Story 7.3.2
**As an** Enterprise Architect,  
**I want to** create and share custom visualizations (charts, graphs, maps),  
**so that** I can build compelling presentations for stakeholders.

**Acceptance Criteria:**
- [ ] Chart library: bar, line, pie, donut, scatter, heatmap, Sankey, Gantt, treemap
- [ ] Visualization types: capability tree, application landscape map, dependency graph, data lineage diagram
- [ ] Combine multiple charts into a "story" (slide deck within the tool)
- [ ] Annotate charts with commentary
- [ ] Publish visualization to dashboard or share via link
- [ ] Embed chart in external pages via iframe or API

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 7.4: Transformation & Roadmap Reports

### User Story 7.4.1
**As a** CIO,  
**I want to** view a digital transformation roadmap showing migration progress,  
**so that** I can track progress against strategic initiatives.

**Acceptance Criteria:**
- [ ] Roadmap timeline view: projects on a Gantt chart by quarter/year
- [ ] Project status: on track (green), at risk (yellow), delayed (red), completed (blue)
- [ ] Filter by initiative type: cloud migration, modernization, decommission, security
- [ ] Budget utilization per project
- [ ] Applications impacted per project
- [ ] Milestone tracking: key dates vs. actual
- [ ] Export roadmap to PowerPoint

**Priority: SHOULD-HAVE (Phase 2)**

---

### User Story 7.4.2
**As an** Enterprise Architect,  
**I want to** track rationalization progress over time,  
**so that** I can report on the value delivered by the EA program.

**Acceptance Criteria:**
- [ ] Rationalization decisions log: application, decision, date, decision-maker, rationale
- [ ] Cumulative savings from rationalization: cost avoided, licenses freed, infrastructure reduced
- [ ] Decision funnel: applications assessed → decisions made → actions completed
- [ ] Before/after portfolio metrics: app count, avg cost, avg risk
- [ ] Business case tracker: projected savings vs. realized savings

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 7.5: Subscription & Notification Reports

### User Story 7.5.1
**As an** Application Owner,  
**I want to** subscribe to email alerts for changes to my applications,  
**so that** I stay informed without manually checking the system.

**Acceptance Criteria:**
- [ ] Subscription options: all changes, specific fields only, lifecycle changes, cost changes, relationship changes
- [ ] Frequency: real-time (email per change), daily digest, weekly digest
- [ ] Filter by application, business unit, capability
- [ ] Manage all subscriptions from a "My Subscriptions" page
- [ ] Unsubscribe from any alert

**Priority: SHOULD-HAVE (MVP+)**

---

### User Story 7.5.2
**As an** IT Director,  
**I want to** receive a weekly portfolio health digest email,  
**so that** I stay updated on the portfolio without logging in every day.

**Acceptance Criteria:**
- [ ] Automated weekly email: "Your Portfolio Weekly Digest"
- [ ] Content: new applications this week, apps entering maintenance, upcoming renewals, EOL alerts, pending reviews
- [ ] Configurable: choose which sections to include
- [ ] Sent every Monday morning (configurable day/time)
- [ ] Plain text and HTML email formats

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 7.6: Data Export & API

### User Story 7.6.1
**As a** Data Engineer,  
**I want to** export EA data via a well-documented REST API,  
**so that** I can integrate EA data into data warehouses, BI tools, and other enterprise systems.

**Acceptance Criteria:**
- [ ] RESTful API endpoints for all major entities: applications, capabilities, interfaces, components, SaaS
- [ ] GraphQL API for flexible, nested queries (Phase 2)
- [ ] Pagination: cursor-based, configurable page size
- [ ] Filtering and sorting via query parameters
- [ ] API key authentication with per-key permissions
- [ ] Rate limiting: 100 requests/minute standard, 1000 for enterprise
- [ ] Swagger/OpenAPI documentation auto-generated
- [ ] Webhook support for real-time change notifications

**Priority: MUST-HAVE (MVP)**

---

## MVP Scope Summary (Module 6)

| Feature | MVP | Phase 2 |
|---------|-----|---------|
| Executive dashboard with KPIs | ✅ | |
| Financial overview dashboard | ✅ | |
| Risk/security dashboard | ✅ | |
| Standard report templates | ✅ | |
| Custom report builder | ✅ | |
| Scheduled report delivery | ✅ | |
| Subscription alerts (email) | ✅ | |
| REST API for data export | ✅ | |
| Self-service query builder | | ✅ |
| Custom visualization library | | ✅ |
| Transformation roadmap view | | ✅ |
| Rationalization tracking | | ✅ |
| Natural language query | | ✅ |
| Weekly digest email | | ✅ |

---

*Previous: [SaaS & Cloud Portfolio Management ←](./06-module-saas-cloud.md) | Next: [Cross-Cutting Platform Features →](./08-platform-features.md)*
