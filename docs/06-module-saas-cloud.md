# Module 5: SaaS & Cloud Portfolio Management

## Overview
As organizations adopt more SaaS applications, **shadow IT and license sprawl** become major risks. This module discovers, tracks, and optimizes the SaaS and cloud application portfolio—providing finance, IT, and security teams with visibility they currently lack.

---

## Epic 5.1: SaaS Discovery & Inventory

### User Story 5.1.1
**As an** IT Director,  
**I want to** automatically discover SaaS applications in use across the organization (via SSO logs, network traffic, or API integrations),  
**so that** I can build a complete SaaS inventory without relying solely on self-reporting.

**Acceptance Criteria:**
- [ ] Discovery sources: SSO (Okta, Azure AD, Google Workspace), network proxy logs, SaaS management platform API (e.g., Spin.ai, Zylo, BetterCloud)
- [ ] Auto-detection of new SaaS apps with alert to IT
- [ ] Discovery frequency: daily or on-demand scan
- [ ] Duplicate merging (same app discovered from multiple sources)
- [ ] Ownership assignment workflow: assign an owner to newly discovered apps
- [ ] Whitelist: mark approved SaaS vs. unapproved (shadow IT)

**Priority: SHOULD-HAVE (Phase 2)**

---

### User Story 5.1.2
**As an** IT Director,  
**I want to** maintain a comprehensive SaaS registry with business and financial metadata,  
**so that** I can manage the full SaaS lifecycle from procurement to retirement.

**Acceptance Criteria:**
- [ ] SaaS-specific fields: vendor, product URL, pricing model (per user, per seat, flat fee, usage-based), contract term, renewal date, auto-renewal flag
- [ ] Link to procurement record (contract, PO, vendor agreement)
- [ ] Business justification and approved use cases
- [ ] Data residency: where is data stored (country, region)?
- [ ] Compliance certifications held by vendor: SOC 2, ISO 27001, GDPR, HIPAA
- [ ] Integration with corporate directory (user provisioning via SCIM)

**Priority: MUST-HAVE (MVP)**

---

## Epic 5.2: License Management & Optimization

### User Story 5.2.1
**As an** IT Director,  
**I want to** track seat utilization for all SaaS applications,  
**so that** I can identify over-licensing and eliminate waste.

**Acceptance Criteria:**
- [ ] Fields: total purchased seats, active users, concurrent users, last login date
- [ ] Utilization % with status: Optimal (70-90%), Over-licensed (>90%), Under-licensed (<70% warning)
- [ ] Automated sync with SaaS admin API to pull actual user count (Phase 2)
- [ ] Bulk user deprovisioning workflow: export list of inactive users (>90 days) for manager review
- [ ] Monthly utilization trend chart per app
- [ ] Annual waste estimate: (unused seats × cost per seat)

**Priority: MUST-HAVE (MVP)**

---

### User Story 5.2.2
**As an** IT Director,  
**I want to** identify duplicate SaaS applications serving the same purpose (e.g., 3 project management tools),  
**so that** I can propose consolidation to reduce cost and complexity.

**Acceptance Criteria:**
- [ ] Category classification per SaaS app: CRM, HRM, Project Management, Collaboration, etc.
- [ ] Duplicate detection: same category, multiple vendors
- [ ] Side-by-side comparison: cost, users, features
- [ ] Consolidation roadmap with estimated savings
- [ ] Functional overlap scoring (manual or AI-assisted, Phase 2)

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 5.3: Shadow IT Detection & Governance

### User Story 5.3.1
**As an** CISO,  
**I want to** identify unapproved SaaS applications (shadow IT),  
**so that** I can assess security and compliance risks and take action.

**Acceptance Criteria:**
- [ ] Flag apps not in the approved SaaS registry
- [ ] Risk scoring for shadow IT: data sensitivity × user count × compliance exposure
- [ ] Notification to business unit owner on discovery of shadow IT
- [ ] Triage workflow: approve, block, monitor, or migrate
- [ ] Shadow IT dashboard: total unapproved apps, users at risk, cost of untracked spend
- [ ] Trend: shadow IT growth month-over-month

**Priority: SHOULD-HAVE (Phase 2)**

---

### User Story 5.3.2
**As an** Enterprise Architect,  
**I want to** enforce a SaaS approval policy and gate new tool requests,  
**so that** all SaaS procurement goes through proper evaluation.

**Acceptance Criteria:**
- [ ] New SaaS request form: tool name, vendor, use case, business unit, users, estimated cost
- [ ] Approval workflow: requester → IT review → Security review → Finance review → approved/denied
- [ ] Pre-built evaluation criteria: security, data residency, integration, cost, contract terms
- [ ] Decision rationale captured
- [ ] Approved SaaS list auto-updated after approval
- [ ] Annual review trigger for all approved SaaS apps

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 5.4: SaaS Spend Management

### User Story 5.4.1
**As an** CFO / IT Finance,  
**I want to** track and analyze total SaaS spending across all vendors,  
**so that** I can optimize budget allocation and negotiate better contracts.

**Acceptance Criteria:**
- [ ] Annual contract value (ACV) per SaaS app
- [ ] Monthly spend tracking
- [ ] Breakdown by: business unit, department, category, vendor
- [ ] Spend trends: month-over-month, year-over-year
- [ ] Contract renewal calendar with alerts (90, 60, 30 days before renewal)
- [ ] Benchmarking: our spend vs. market average for similar tools (Phase 2)
- [ ] Vendor concentration risk: % of spend with single vendor

**Priority: MUST-HAVE (MVP)**

---

### User Story 5.4.2
**As an** IT Director,  
**I want to** forecast future SaaS spend based on user growth and contract terms,  
**so that** I can budget accurately for the next fiscal year.

**Acceptance Criteria:**
- [ ] Seat growth projection per app (based on historical trend or user input)
- [ ] Auto-renewal cost impact (annual price escalation clauses)
- [ ] Cost projection: next 12 months, next 24 months
- [ ] Scenario modeling: what if we add 100 users to Tool X?
- [ ] Export forecast to Excel for finance integration

**Priority: COULD-HAVE (Phase 2)**

---

## Epic 5.5: Vendor Risk Management

### User Story 5.5.1
**As an** CISO,  
**I want to** assess the security and compliance posture of SaaS vendors,  
**so that** I can make informed decisions and reduce third-party risk.

**Acceptance Criteria:**
- [ ] Vendor security questionnaire (custom or standard: CAIQ, SIG)
- [ ] Vendor security score: based on certifications (SOC 2, ISO 27001), questionnaire responses, breach history
- [ ] Data processing agreement (DPA) tracking: has DPA been signed? GDPR compliant?
- [ ] Sub-processor list: what third parties does the vendor use?
- [ ] Breach notification SLA: vendor must notify within X hours
- [ ] Risk rating: Critical, High, Medium, Low
- [ ] Automated alerts: vendor breach in the news, certification expiry

**Priority: SHOULD-HAVE (Phase 2)**

---

### User Story 5.5.2
**As an** CISO,  
**I want to** track contractual SLA compliance for critical SaaS vendors,  
**so that** I can hold vendors accountable and document service credits.

**Acceptance Criteria:**
- [ ] SLA definitions per vendor: uptime %, response time, support tier
- [ ] Uptime monitoring via synthetic checks or third-party tool integration (Phase 2)
- [ ] SLA breach log: date, duration, vendor acknowledgment
- [ ] Service credit tracking: did we receive the credit owed?
- [ ] Vendor performance scorecard: uptime history, breach count, support rating

**Priority: COULD-HAVE (Phase 2)**

---

## Epic 5.6: Cloud Resource Management

### User Story 5.6.1
**As an** Cloud Architect,  
**I want to** track cloud resources (AWS, Azure, GCP) linked to applications,  
**so that** I can map cloud consumption to business units and applications.

**Acceptance Criteria:**
- [ ] Cloud account/tenant registry with linked applications
- [ ] Resource types: compute instances, storage buckets, databases, serverless functions
- [ ] Cost attribution: tag resources by application, environment, cost center
- [ ] Utilization metrics: CPU %, memory %, storage used vs. allocated
- [ ] Right-sizing recommendations: over-provisioned resources
- [ ] Anomaly alerts: unexpected cost spikes

**Priority: COULD-HAVE (Phase 2)**

---

## MVP Scope Summary (Module 5)

| Feature | MVP | Phase 2 |
|---------|-----|---------|
| SaaS registry (CRUD) with financial data | ✅ | |
| Seat utilization tracking | ✅ | |
| Total SaaS spend tracking & breakdown | ✅ | |
| Contract renewal calendar | ✅ | |
| SaaS discovery (SSO/network scan) | | ✅ |
| Shadow IT detection | | ✅ |
| SaaS approval workflow & governance | | ✅ |
| Duplicate SaaS detection | | ✅ |
| Spend forecasting | | ✅ |
| Vendor security scorecard | | ✅ |
| Cloud resource management | | ✅ |

---

*Previous: [Data Flow & Integration Architecture ←](./05-module-data-flows.md) | Next: [Reports, Dashboards & Analytics →](./07-reports-analytics.md)*
