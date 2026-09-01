# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: page-smoke.spec.ts >> all authenticated pages render
- Location: page-smoke.spec.ts:36:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
Call log:
  - navigating to "http://localhost:3005/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Sprint 39.3 - smoke test that every authenticated page renders.
  5  |  * Visits each route and asserts an <h1> heading is present.
  6  |  */
  7  | const ROUTES = [
  8  |   '/',
  9  |   '/applications',
  10 |   '/capabilities',
  11 |   '/heatmap',
  12 |   '/saas',
  13 |   '/saas/requests',
  14 |   '/interfaces',
  15 |   '/components',
  16 |   '/eol-risk',
  17 |   '/data-quality',
  18 |   '/query-builder',
  19 |   '/insights',
  20 |   '/advanced-analytics',
  21 |   '/exports',
  22 |   '/resource-allocation',
  23 |   '/compliance',
  24 |   '/audit-logs',
  25 |   '/transformation-roadmap',
  26 |   '/graph',
  27 |   '/reports',
  28 |   '/reports/builder',
  29 |   '/users',
  30 |   '/settings',
  31 |   '/workflows',
  32 |   '/tech-standards',
  33 |   '/c4-diagrams',
  34 | ];
  35 | 
  36 | test('all authenticated pages render', async ({ page }) => {
> 37 |   await page.goto('/login');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
  38 |   await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'admin@basemap.io');
  39 |   await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'Admin123!');
  40 |   await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  41 |   await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
  42 | 
  43 |   for (const route of ROUTES) {
  44 |     await test.step(`render ${route}`, async () => {
  45 |       await page.goto(route);
  46 |       await page.waitForLoadState('networkidle');
  47 |       await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  48 |     });
  49 |   }
  50 | });
```