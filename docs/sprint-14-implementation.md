# Sprint 14: Application-Capability Mapping

This sprint focuses on creating the many-to-many relationship mapping between Applications and Business Capabilities. We will build a UI on the application detail page to allow users to link applications to specific capabilities, select the level of support (Primary, Supporting, Enabling), and visualize capability gaps.

## User Review Required

> [!IMPORTANT]
> - **Audit Trails**: We will implement the audit trail (14.8) by directly inserting an entry into the `AuditLog` table whenever an application is mapped or unmapped to a capability.
> - **Color-Coded Coverage**: To visualize gaps, we will update the `CapabilityTree` components to render badges in Red (0 apps mapped), Yellow (partial support or sub-capabilities unmapped), and Green (fully supported).

## Open Questions

> [!WARNING]
> 1. For the "Color-coded coverage" logic: if a parent capability has 0 direct applications mapped, but its *child* capabilities have applications, should the parent be marked Green, Yellow, or Red?
> 2. On the application detail page, do you prefer a dedicated "Capabilities" tab/panel, or should it be a modal dialog for adding/removing capability links?

## Proposed Changes

---

### Backend API (apps/api)

We already have the base `ApplicationCapability` join table and API methods from previous sprints. We will augment them.

#### [MODIFY] apps/api/src/capabilities/dto/create-capability.dto.ts
- Update `MapApplicationDto` to accurately reflect the support level enum: `Primary`, `Supporting`, `Enabling`.

#### [MODIFY] apps/api/src/capabilities/capabilities.service.ts
- Update `mapApplication` and `unmapApplication` to record an entry in the `AuditLog` table.

#### [MODIFY] apps/api/src/applications/applications.service.ts (or similar)
- Ensure the `findOne` application method includes the `capabilities` relation and the associated `CapabilityNode` data so the frontend can render the currently mapped capabilities.

---

### Frontend UI (apps/web)

#### [MODIFY] apps/web/src/components/applications/capability-mapping.tsx
- Build out the mapping panel for the Application Detail Page.
- Add a search/dropdown combobox to find and select a capability.
- Add a selector for "Support Level".
- Show a table/list of currently mapped capabilities with an "Unlink" button.

#### [MODIFY] apps/web/src/components/capabilities/capability-tree.tsx
- Apply the color-coded gap analysis logic to the capability node badges.
- **Red**: 0 apps mapped.
- **Yellow**: >0 apps mapped, but some child nodes have 0 apps (partial coverage).
- **Green**: >0 apps mapped, and all child nodes are fully covered.

## Verification Plan

### Automated Tests
- Unit tests verifying that mapping and unmapping an application creates the appropriate audit logs.

### Manual Verification
- Navigate to an Application detail page, search for a capability, map it, and verify it appears in the list.
- Navigate to the Capabilities view and verify the node colors accurately reflect the mapping coverage according to the defined logic.
