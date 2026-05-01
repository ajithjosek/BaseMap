# Sprint 12 Preparation

**Date:** April 30, 2026  
**Project:** BaseMap EAM Tool  
**Previous Sprint:** 11 (Complete - Import/Export & Notifications)  
**Next Sprint:** 12 - Missing Pages + Advanced Features

## Sprint 11 Recap

All Sprint 11 features were successfully implemented and verified:
- Import/Export with actual processing (CSV/Excel/JSON)
- Notification Center with email integration
- Lifecycle change notifications
- EOL alert scheduler
- All builds pass (backend + frontend)

## Current Codebase State

### Existing Pages
- `/` - Dashboard (executive metrics)
- `/applications` - Applications list
- `/applications/new` - Create application
- `/applications/[id]` - Application detail
- `/applications/[id]/edit` - Edit application
- `/capabilities` - Capabilities tree

### Missing Pages (sidebar links exist)
- `/saas` - SaaS & Cloud management
- `/reports` - Reports and analytics
- `/users` - User management
- `/settings` - Settings and preferences

### Existing API Modules
- applications, auth, capabilities, costs, dashboards
- import-export, interfaces, notifications, users, prisma

## Sprint 12 Scope

### Week 1: Missing Pages
| Task | Description | Priority |
|------|-------------|----------|
| 12.1 | `/saas` - SaaS applications list, create, edit, contract tracking | High |
| 12.2 | `/reports` - Charts with recharts, export buttons, lifecycle/cost/risk reports | High |
| 12.3 | `/users` - User list, create, edit, role assignment, active/inactive toggle | High |
| 12.4 | `/settings` - Tenant settings, notification preferences, profile settings | High |

### Week 2: Export UI + Column Mapping
| Task | Description | Priority |
|------|-------------|----------|
| 12.5 | Export configuration component (filter, column selection, format, scheduling) | High |
| 12.6 | Column mapping UI for import wizard (drag-and-drop column matching) | High |
| 12.7 | Integrate export buttons into applications list and dashboard | High |

### Week 3: Background Processing + WebSocket
| Task | Description | Priority |
|------|-------------|----------|
| 12.8 | BullMQ queue setup with Redis connection | High |
| 12.9 | Import/export workers for async background processing | High |
| 12.10 | WebSocket gateway for real-time notification updates | Medium |
| 12.11 | Frontend WebSocket listener for live notification badge updates | Medium |

### Week 4: Polish + Integration
| Task | Description | Priority |
|------|-------------|----------|
| 12.12 | Notification preferences API and UI (channel, frequency, types) | Medium |
| 12.13 | Export job history page | Medium |
| 12.14 | Integration testing and bug fixes | High |
| 12.15 | Documentation updates | Medium |

## Dependencies to Install

```bash
# Backend
npm install @nestjs/websockets @nestjs/platform-ws bullmq ioredis

# Frontend (already installed)
# - recharts (already in package.json)
# - @radix-ui/react-switch (already in root package.json)
```

## Database Changes

No new tables needed - all required tables exist from Sprint 11:
- `notifications` - for notification preferences (extend with metadata)
- `import_jobs` / `export_jobs` - for job history
- `email_logs` - for email tracking

May need:
- `user_preferences` extension for notification settings per user

## Risks & Considerations

1. **Redis dependency**: BullMQ requires Redis - need to add Redis to docker-compose
2. **WebSocket**: May need to handle CORS for WebSocket connections
3. **Page complexity**: 4 new pages + multiple components is a large sprint - may need to prioritize

## Success Criteria

- All 4 missing pages functional with CRUD operations
- Export UI integrated with existing export API
- Column mapping functional in import wizard
- Background job processing working (import/export jobs run async)
- Real-time notification updates via WebSocket
- All builds pass (backend + frontend)

## Sign-off

- [ ] Sprint 12 scope confirmed
- [ ] Dependencies installed
- [ ] Redis added to docker-compose
- [ ] Implementation started

---

**Prepared by:** opencode AI Assistant  
**Date:** April 30, 2026  
**Status:** Ready for Sprint 12 Implementation
