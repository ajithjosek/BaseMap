# Module 1: Application Portfolio Management (APM)

## Overview
Application Portfolio Management is the **foundation** of the EAM tool. It provides a complete, searchable inventory of all applications across the enterprise—with business ownership, technical details, costs, risks, and lifecycle status.

---

## Epic 1.1: Application Inventory & Master Data

### User Story 1.1.1
**As an** Application Owner,  
**I want to** register a new application with all relevant metadata,  
**so that** the enterprise has an accurate record of all deployed software.

**Acceptance Criteria:**
- [ ] Create application with required fields: name, owner, business unit, description
- [ ] Support optional fields: vendor, version, license type, contract end date, support tier
- [ ] Assign application to one or more business capabilities
- [ ] Link application to its technical components (servers, databases, APIs)
- [ ] Set initial lifecycle state: `Planning | Active | Maintenance | Retirement | Retired`
- [ ] Capture total cost of ownership (TCO) broken down by: license, infrastructure, support
- [ ] Auto-generate unique application ID on creation
- [ ] Audit trail: who created, when, and all subsequent changes

**Priority: MUST-HAVE (MVP)**

---

### User Story 1.1.2
**As an** Enterprise Architect,  
**I want to** import applications in bulk from CSV/Excel,  
**so that** I can bootstrap the portfolio without manual data entry.

**Acceptance Criteria:**
- [ ] Upload CSV/Excel file with mapping to application schema
- [ ] Preview data before import with validation errors highlighted
- [ ] Support partial imports (import valid rows, skip invalid with reason)
- [ ] Duplicate detection: match on name + vendor, prompt user for action
- [ ] Background processing for large files (> 500 rows)
- [ ] Email notification on import completion with summary

**Priority: MUST-HAVE (MVP)**

---

### User Story 1.1.3
**As an** IT Director,  
**I want to** search and filter the application inventory using multiple criteria,  
**so that** I can quickly find relevant applications for analysis.

**Acceptance Criteria:**
- [ ] Full-text search across name, description, vendor, tags
- [ ] Filter by: lifecycle state, business unit, owner, technology type, risk score, cost range
- [ ] Save and name custom filter views (e.g., "High-Risk Apps", "SAP Landscape")
- [ ] Sort by any column (name, cost, risk, last updated)
- [ ] Pagination with configurable page size (25, 50, 100, 200)
- [ ] Export filtered/sorted results to CSV/Excel

**Priority: MUST-HAVE (MVP)**

---

## Epic 1.2: Application Lifecycle Management

### User Story 1.2.1
**As an** Application Owner,  
**I want to** update the lifecycle state of an application,  
**so that** stakeholders understand the application's trajectory.

**Acceptance Criteria:**
- [ ] Lifecycle states: Planning → Active → Maintenance → Retirement → Retired
- [ ] Each state transition requires: reason/notes, effective date, approver (optional)
- [ ] Configure custom lifecycle stages per organization (e.g., add "Sunset" stage)
- [ ] Visual lifecycle timeline view per application
- [ ] Notification triggered on state change sent to stakeholders
- [ ] Block certain transitions unless prerequisites are met (e.g., data migrated before retirement)

**Priority: MUST-HAVE (MVP)**

---

### User Story 1.2.2
**As an** Enterprise Architect,  
**I want to** schedule retirement or migration projects linked to applications,  
**so that** decommissioning and modernization are tracked and planned.

**Acceptance Criteria:**
- [ ] Create project (name, target date, budget, owner, type: Migration | Decommission | Consolidation | Upgrade)
- [ ] Link one or more applications to a project
- [ ] Track project status: Not Started | In Progress | At Risk | Completed | On Hold
- [ ] Dashboard showing applications pending retirement vs. completed
- [ ] Overdue retirement alerts (application past end-of-life date)

**Priority: SHOULD-HAVE (MVP+)**

---

## Epic 1.3: Application Rationalization

### User Story 1.3.1
**As an** IT Director,  
**I want to** assess applications using a scoring matrix (business value vs. technical quality),  
**so that** I can identify candidates for keep/invest/migrate/consolidate/retire actions.

**Acceptance Criteria:**
- [ ] Configurable scoring dimensions: Business Criticality (1-5), Technical Health (1-5), Cost (1-5), Security Risk (1-5)
- [ ] Automated score calculation based on underlying attributes
- [ ] Manual override with justification
- [ ] 2x2 or 3x3 prioritization matrix visualization
- [ ] Generate rationalization recommendations automatically based on scores
- [ ] Bulk action: apply recommendation to multiple applications

**Priority: SHOULD-HAVE (MVP+)**

---

### User Story 1.3.2
**As an** Enterprise Architect,  
**I want to** detect and flag duplicate/redundant applications,  
**so that** I can propose consolidation to reduce cost and complexity.

**Acceptance Criteria:**
- [ ] Similarity detection: name fuzzy match, shared capabilities, shared interfaces
- [ ] Clustering algorithm to group likely duplicates
- [ ] Side-by-side comparison view of two applications
- [ ] Actionable recommendations: merge, keep one, archive other
- [ ] Track consolidation savings (cost, license count)

**Priority: COULD-HAVE (Phase 2)**

---

## Epic 1.4: Application Cost Tracking

### User Story 1.4.1
**As an** CFO / IT Finance,  
**I want to** view and analyze total cost of ownership per application, per business unit, or per project,  
**so that** I can identify cost reduction opportunities and chargeback/showback costs.

**Acceptance Criteria:**
- [ ] Cost types: License/SaaS fee, Infrastructure (compute, storage, network), Support & Maintenance, Internal Labor
- [ ] Input costs at application level (annual or monthly)
- [ ] Aggregate by business unit, cost center, technology type
- [ ] Cost trends over time (monthly, quarterly)
- [ ] Comparison view: actual vs. budget
- [ ] Cost breakdown chart: pie, bar, waterfall

**Priority: MUST-HAVE (MVP)**

---

### User Story 1.4.2
**As an** Application Owner,  
**I want to** track license utilization (seats allocated vs. used),  
**so that** I can optimize license spend and avoid compliance risks.

**Acceptance Criteria:**
- [ ] Enter license metrics: total seats, currently assigned, max concurrent
- [ ] Calculate utilization percentage with color-coded status (green >80%, yellow 50-80%, red <50%)
- [ ] Alert when utilization drops below threshold
- [ ] Link license to vendor contract for renewal planning

**Priority: SHOULD-HAVE (MVP+)**

---

## Epic 1.5: Application Relationships & Dependencies

### User Story 1.5.1
**As an** Enterprise Architect,  
**I want to** document and visualize dependencies between applications,  
**so that** I understand the ripple effect of changes or outages.

**Acceptance Criteria:**
- [ ] Relationship types: consumes API, shares database, depends on, provides data to, integrates via middleware
- [ ] Add/edit/remove relationships via application detail page
- [ ] Dependency graph view (directed acyclic graph)
- [ ] Impact analysis: if Application X fails, what downstream apps are affected?
- [ ] Circular dependency detection with warning

**Priority: MUST-HAVE (MVP)**

---

### User Story 1.5.2
**As an** Application Owner,  
**I want to** map applications to the business capabilities they support,  
**so that** I can demonstrate IT's contribution to business value.

**Acceptance Criteria:**
- [ ] Many-to-many relationship: one application supports multiple capabilities
- [ ] Support level per mapping: Primary | Supporting | Enabling
- [ ] Heatmap view: capability coverage (how many apps support each capability)
- [ ] Gap analysis: capabilities with no supporting application

**Priority: MUST-HAVE (MVP)**

---

## Epic 1.6: Technical Metadata & IT Documentation

### User Story 1.6.1
**As an** Integration Architect,  
**I want to** document the technical stack of each application (language, framework, OS, database),  
**so that** I have a complete technology census of the enterprise.

**Acceptance Criteria:**
- [ ] Predefined technology type taxonomy: ERP, CRM, BI, Collaboration, Custom, Package, etc.
- [ ] Custom attributes: programming language, framework, runtime, OS, containerization, cloud provider
- [ ] Tech stack summary per application (list view)
- [ ] Enterprise-wide technology usage report (top languages, databases, cloud providers)

**Priority: MUST-HAVE (MVP)**

---

## MVP Scope Summary (Module 1)

| Feature | MVP | Phase 2 |
|---------|-----|---------|
| Create/Edit/Delete applications | ✅ | |
| Bulk import (CSV/Excel) | ✅ | |
| Search & filter | ✅ | |
| Lifecycle state management | ✅ | |
| Cost tracking | ✅ | |
| Application relationships/dependencies | ✅ | |
| Capability mapping | ✅ | |
| Tech stack documentation | ✅ | |
| Retirement projects & scheduling | | ✅ |
| Scoring & rationalization matrix | | ✅ |
| Duplicate detection | | ✅ |
| License utilization tracking | | ✅ |

---

*Previous: [Product Vision & Overview ←](./01-product-vision.md) | Next: [Business Capability Mapping →](./03-module-business-capabilities.md)*
