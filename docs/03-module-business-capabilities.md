# Module 2: Business Capability Mapping

## Overview
Business Capability Mapping creates a **structured view of what the business does**—independent of how it is done. It connects business capabilities to the processes, applications, data, and projects that enable them, creating full traceability from strategy to execution.

---

## Epic 2.1: Capability Model Definition

### User Story 2.1.1
**As an** Enterprise Architect,  
**I want to** define a hierarchical capability map (levels 1–4),  
**so that** the organization has a structured, standardized view of its capabilities.

**Acceptance Criteria:**
- [ ] Create capability tree with unlimited depth (recommended: 3-4 levels)
- [ ] Level 1: Capability Areas (e.g., "Customer Management")
- [ ] Level 2: Capabilities (e.g., "Customer Acquisition", "Customer Retention")
- [ ] Level 3: Sub-capabilities (e.g., "Lead Management", "Quote to Order")
- [ ] Level 4: Detailed Activities (e.g., "Lead Qualification", "Opportunity Management")
- [ ] Drag-and-drop reordering within the tree
- [ ] Add description, owner, and strategic importance to each capability node
- [ ] Lock capability structure to prevent unauthorized changes

**Priority: MUST-HAVE (MVP)**

---

### User Story 2.1.2
**As an** Business Analyst,  
**I want to** import a capability model from Excel or from LeanIX/Mega export,  
**so that** I don't have to rebuild existing models from scratch.

**Acceptance Criteria:**
- [ ] Import from CSV/Excel with parent-child hierarchy
- [ ] Merge with existing model (add new nodes, update existing)
- [ ] Full replacement import option
- [ ] Map imported columns to capability fields

**Priority: SHOULD-HAVE (MVP+)**

---

## Epic 2.2: Capability-Application Mapping

### User Story 2.2.1
**As an** Business Analyst,  
**I want to** link applications to the capabilities they support,  
**so that** I can see which capabilities are enabled by which IT systems.

**Acceptance Criteria:**
- [ ] Link applications to capability nodes at any level
- [ ] Specify support level: Primary (core), Supporting (secondary), Enabling (utility)
- [ ] Visual indicator of support level on capability tree
- [ ] Count of applications per capability
- [ ] Color-coded capability coverage (green: adequately covered, red: gap, yellow: risk)

**Priority: MUST-HAVE (MVP)**

---

### User Story 2.2.2
**As an** Enterprise Architect,  
**I want to** generate a Capability-to-Application (C2A) heatmap,  
**so that** I can quickly spot gaps, redundancies, and areas of concern.

**Acceptance Criteria:**
- [ ] Matrix view: capabilities (rows) vs. applications (columns)
- [ ] Cell color: Primary (dark), Supporting (medium), Enabling (light), None (empty)
- [ ] Filter by business unit, lifecycle state, risk level
- [ ] Export to Excel and PDF

**Priority: MUST-HAVE (MVP)**

---

### User Story 2.2.3
**As an** IT Director,  
**I want to** analyze " Application sprawl" per capability,  
**so that** I can identify over-engineered capabilities and propose consolidation.

**Acceptance Criteria:**
- [ ] Per-capability app count with trend over time
- [ ] Flag capabilities with > N applications (threshold configurable)
- [ ] Identify capabilities with multiple apps of the same type (e.g., 3 CRM systems)
- [ ] Consolidation savings estimate based on app count reduction

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 2.3: Process-to-Capability Mapping

### User Story 2.3.1
**As an** Business Analyst,  
**I want to** map business processes to capabilities,  
**so that** I can trace how processes flow through the capability model.

**Acceptance Criteria:**
- [ ] Create process entities: name, description, process owner, category
- [ ] Link processes to capabilities (one-to-many)
- [ ] Process flow view: sequential capabilities that a process touches
- [ ] Identify process "touchpoints" across capability boundaries

**Priority: SHOULD-HAVE (MVP+)**

---

## Epic 2.4: Capability Gap Analysis

### User Story 2.4.1
**As an** Enterprise Architect,  
**I want to** identify and document capability gaps (capabilities with no or weak IT support),  
**so that** I can propose targeted technology investments.

**Acceptance Criteria:**
- [ ] Automatically flag capabilities with zero applications linked
- [ ] Manual gap classification: Strategic Gap, Operational Gap, Compliance Gap
- [ ] Add gap description, impact, and proposed solution
- [ ] Link gap to a project or initiative for resolution tracking
- [ ] Gap trend report: gaps opened vs. closed over time

**Priority: MUST-HAVE (MVP)**

---

### User Story 2.4.2
**As an** Enterprise Architect,  
**I want to** perform "what-if" scenario analysis for capability investment,  
**so that** I can justify technology decisions to leadership.

**Acceptance Criteria:**
- [ ] Add/remove proposed applications to a capability virtually
- [ ] Scenario comparison: current state vs. proposed state vs. target state
- [ ] Impact on coverage score, cost, risk
- [ ] Save scenarios for stakeholder review

**Priority: COULD-HAVE (Phase 2)**

---

## Epic 2.5: Capability Governance & Ownership

### User Story 2.5.1
**As an** Enterprise Architect,  
**I want to** assign owners and stewards to each capability,  
**so that** accountability for capability health is clear.

**Acceptance Criteria:**
- [ ] Assign primary owner (person) per capability
- [ ] Assign additional stewards (team or role)
- [ ] Capability owner receives notifications on changes, gaps, and reviews
- [ ] RACI matrix export: R = Responsible, A = Accountable, C = Consulted, I = Informed

**Priority: MUST-HAVE (MVP)**

---

### User Story 2.5.2
**As an** Enterprise Architect,  
**I want to** run periodic capability health reviews,  
**so that** the model stays current and reflects the evolving business.

**Acceptance Criteria:**
- [ ] Define review cadence per capability (quarterly, semi-annual, annual)
- [ ] Automated review reminders to capability owners
- [ ] Review checklist: confirm linked apps still accurate, update descriptions, reassess importance
- [ ] Review history log with reviewer name and date
- [ ] Flag capabilities with overdue reviews

**Priority: SHOULD-HAVE (Phase 2)**

---

## Epic 2.6: Capability Benchmarking & KPIs

### User Story 2.6.1
**As an** Enterprise Architect,  
**I want to** define and track KPIs per capability,  
**so that** I can measure capability effectiveness over time.

**Acceptance Criteria:**
- [ ] Add custom KPI definitions: name, unit, target value, measurement frequency
- [ ] Link KPIs to specific capabilities
- [ ] KPI value input form (manual entry or via integration)
- [ ] KPI trend chart per capability
- [ ] Threshold alerts (KPI above/below target triggers notification)

**Priority: COULD-HAVE (Phase 2)**

---

## MVP Scope Summary (Module 2)

| Feature | MVP | Phase 2 |
|---------|-----|---------|
| Hierarchical capability tree (CRUD) | ✅ | |
| Drag-and-drop tree editor | ✅ | |
| Application-capability mapping | ✅ | |
| C2A heatmap visualization | ✅ | |
| Gap analysis & flagging | ✅ | |
| Capability ownership & RACI | ✅ | |
| Process-to-capability mapping | | ✅ |
| Bulk import of capability model | | ✅ |
| What-if scenario analysis | | ✅ |
| Capability health reviews & cadence | | ✅ |
| Capability KPIs & benchmarking | | ✅ |

---

*Previous: [Application Portfolio Management ←](./02-module-apm.md) | Next: [Technology & Infrastructure Architecture →](./04-module-technology-architecture.md)*
