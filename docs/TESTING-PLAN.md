# BaseMap Comprehensive Test Suite Plan

## Current State

| Layer | Files | Real Tests | Coverage |
|-------|-------|------------|----------|
| API unit (.spec.ts) | 9 | 0 (all stubs) | 0% |
| API E2E (supertest) | 1 | 1 (hello-world) | 0% |
| Web unit/comp | 0 | 0 | 0% |
| Playwright E2E | 2 | 2 (smoke + critical path) | ~24 routes |
| k6 load | 2 | 2 | dashboards + search |
| **Total** | **14** | **5** | **near zero** |

---

## Test Pyramid

```
           /  E2E (Playwright)  \          ~30 tests
          /  API Integration     \         ~40 tests
         /  (supertest)           \
        /--------------------------\
       /  Web Component Tests       \      ~60 tests
      /  (React Testing Library)     \
     /--------------------------------\
    /  API Unit Tests (Services)        \  ~120 tests
   /  + Utility / Helper Unit Tests      \
  /----------------------------------------\
```

---

## Phase 1 — Test Infrastructure & API Unit Tests (Foundation)

**Goal:** Mock layer, factories, and full service-level coverage for the critical services.

### 1.1 Test Infrastructure

| File | Purpose |
|------|---------|
| `apps/api/test/__mocks__/prisma.mock.ts` | Generic Prisma client mock with fluent chain API |
| `apps/api/test/__mocks__/jwt.mock.ts` | JwtService mock |
| `apps/api/test/__fixtures__/tenant.fixture.ts` | Factory functions per Prisma model |
| `apps/api/test/helpers/test-module.ts` | Reusable Test.createTestingModule() builder |

### 1.2 API Service Unit Tests

Priority order:

| Priority | Module | Service | Key Test Cases |
|----------|--------|---------|----------------|
| P0 | Auth | AuthService | register, login, refreshToken, slug resolution, role lookup |
| P0 | Auth | SsoService | resolveSso (UUID/slug), buildOidcConfig, provisionSsoUser, parseSamlResponse |
| P1 | Applications | ApplicationsService | CRUD, findAll filters, soft delete, lifecycle transitions |
| P1 | Capabilities | CapabilitiesService | CRUD, tree, gaps |
| P1 | Interfaces | InterfacesService | CRUD, status |
| P2 | Costs | CostsService | CRUD, aggregation |
| P2 | Tenants | TenantsService | CRUD, slug uniqueness |

---

## Phase 2 — API Integration Tests (Supertest)

**Goal:** Full HTTP request lifecycle tests with mocked DB.

### 2.1 E2E Test Infrastructure

| File | Purpose |
|------|---------|
| `apps/api/test/helpers/request.ts` | Authenticated request helpers |
| `apps/api/test/app.e2e-spec.ts` | Expand existing hello-world |

### 2.2 Controller Integration Tests (~40 tests)

| Module | Endpoint | Tests |
|--------|----------|-------|
| Auth | POST /auth/login | 200, 401, 404 |
| Auth | POST /auth/register | 201, 409 |
| Auth | POST /auth/refresh | 200, 401 |
| Applications | GET/POST/PATCH/DELETE | Full CRUD |
| Capabilities | GET/POST | Tree + gaps |
| Interfaces | GET/POST | CRUD + status |

---

## Phase 3 — Web Tests (React + Next.js)

### 3.1 Web Test Infrastructure

| File | Purpose |
|------|---------|
| `apps/web/jest.config.ts` | Jest config with next/jest |
| `apps/web/jest.setup.ts` | @testing-library/jest-dom, mocks |
| `apps/web/src/test-utils.tsx` | Custom render with providers |

### 3.2 Component Tests (~60 tests)

| Category | Components |
|----------|-----------|
| Shared | StatusBadge, PageHeader, EmptyState, CommandPalette, Skeletons |
| Layout | Sidebar, MobileNav, BottomNav, LocaleSwitcher |
| Pages | Login, Applications, Capabilities, Interfaces, Heatmap |

### 3.3 Utility Tests

| File | Tests |
|------|-------|
| `lib/navigation.ts` | isActivePathname, findActiveSectionKey, role filtering |
| `lib/api.ts` | Token attachment, error handling |
| `lib/utils.ts` | cn() class merge |

---

## Phase 4 — Extended E2E + CI/CD

### 4.1 Playwright E2E

| Suite | Coverage |
|-------|----------|
| auth.spec.ts | Login, register, logout, role-based nav |
| applications.spec.ts | Full CRUD lifecycle |
| navigation.spec.ts | Sidebar, bottom nav, command palette |
| responsive.spec.ts | Mobile viewport |
| accessibility.spec.ts | Keyboard, ARIA |

### 4.2 k6 Load Tests

| Suite | Target | SLA |
|-------|--------|-----|
| k6-auth-load.js | Login/register | p95 < 500ms |
| k6-api-crud.js | CRUD endpoints | p95 < 1000ms |

### 4.3 CI/CD Pipeline

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | PR: lint, typecheck, test, build |
| `.github/workflows/e2e.yml` | Main: Docker + Playwright |
| `.github/workflows/load.yml` | Weekly: k6 load suite |

---

## Estimated Test Counts

| Layer | Tests | Effort |
|-------|-------|--------|
| API unit (services) | ~120 | 3-4 days |
| API integration (supertest) | ~40 | 2 days |
| Web unit (components) | ~60 | 2-3 days |
| Web unit (utilities) | ~20 | 0.5 day |
| Playwright E2E (extended) | ~30 | 2 days |
| k6 load (extended) | ~4 scripts | 1 day |
| CI/CD pipeline | 3 workflows | 1 day |
| **Total** | **~270 + 7 scripts** | **~12 days** |

---

## Quick Wins (Start Here)

1. `apps/api/test/__mocks__/prisma.mock.ts` — unblocks all API service tests
2. `apps/api/src/auth/auth.service.spec.ts` — covers login/register/refresh
3. `apps/web/jest.config.ts` + `jest.setup.ts` + `test-utils.tsx` — unblocks all web tests
4. `apps/web/src/lib/navigation.test.ts` — covers navigation logic
5. `apps/web/src/components/shared/status-badge.test.tsx` — covers most reused component
