# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-path.spec.ts >> critical path >> run a report
- Location: critical-path.spec.ts:33:7

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
  4  |  * Sprint 39.3 - critical path journey:
  5  |  * login -> create application -> create capability -> map app -> report -> export.
  6  |  * Assumes a seeded API at localhost:4001 and web at localhost:3005.
  7  |  */
  8  | test.describe('critical path', () => {
  9  |   test.beforeEach(async ({ page }) => {
> 10 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
  11 |     await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'admin@basemap.io');
  12 |     await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'Admin123!');
  13 |     await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  14 |     await expect(page).toHaveURL(/dashboard|^\/$/, { timeout: 15000 });
  15 |   });
  16 | 
  17 |   test('create an application', async ({ page }) => {
  18 |     await page.goto('/applications');
  19 |     await page.getByRole('link', { name: /new( application)?/i }).click();
  20 |     await page.getByLabel(/name/i).fill(`E2E App ${Date.now()}`);
  21 |     await page.getByRole('button', { name: /save|create/i }).click();
  22 |     await expect(page.getByText('E2E App')).toBeVisible({ timeout: 10000 });
  23 |   });
  24 | 
  25 |   test('create a capability', async ({ page }) => {
  26 |     await page.goto('/capabilities');
  27 |     await page.getByRole('button', { name: /new|add|create/i }).first().click();
  28 |     await page.getByLabel(/name/i).fill('E2E Capability');
  29 |     await page.getByRole('button', { name: /save|create/i }).click();
  30 |     await expect(page.getByText('E2E Capability')).toBeVisible({ timeout: 10000 });
  31 |   });
  32 | 
  33 |   test('run a report', async ({ page }) => {
  34 |     await page.goto('/reports');
  35 |     await page.getByRole('button', { name: /run|generate/i }).click();
  36 |     await expect(page.getByText(/report|results/i)).toBeVisible({ timeout: 15000 });
  37 |   });
  38 | });
```