# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive.spec.ts >> mobile viewport >> bottom nav tabs navigate to pages
- Location: responsive.spec.ts:40:7

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
  4  |  * Responsive E2E - mobile viewport, bottom nav, mobile sheet.
  5  |  * Uses desktop viewport; actual device emulation is configured per-project.
  6  |  */
  7  | 
  8  | const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
  9  | const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
  10 | const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';
  11 | 
  12 | async function loginMobile(page: any) {
> 13 |   await page.goto(`${WEB_URL}/login`);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
  14 |   await page.getByLabel(/email/i).fill(TEST_EMAIL);
  15 |   await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  16 |   await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  17 |   await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
  18 | }
  19 | 
  20 | test.describe('mobile viewport', () => {
  21 |   test.use({ viewport: { width: 390, height: 844 } });
  22 | 
  23 |   test('bottom navigation bar is visible', async ({ page }) => {
  24 |     await loginMobile(page);
  25 |     const bottomNav = page.locator('nav').filter({ hasText: /home|more/i });
  26 |     await expect(bottomNav).toBeVisible({ timeout: 10000 });
  27 |   });
  28 | 
  29 |   test('desktop sidebar is hidden on mobile', async ({ page }) => {
  30 |     await loginMobile(page);
  31 |     const sidebar = page.locator('.w-64.bg-slate-900');
  32 |     await expect(sidebar).not.toBeVisible();
  33 |   });
  34 | 
  35 |   test('brand bar is visible on mobile', async ({ page }) => {
  36 |     await loginMobile(page);
  37 |     await expect(page.getByRole('link', { name: 'BaseMap' }).first()).toBeVisible();
  38 |   });
  39 | 
  40 |   test('bottom nav tabs navigate to pages', async ({ page }) => {
  41 |     await loginMobile(page);
  42 |     const appsTab = page.locator('nav a[href="/applications"]');
  43 |     if (await appsTab.isVisible()) {
  44 |       await appsTab.click();
  45 |       await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  46 |     }
  47 |   });
  48 | 
  49 |   test('More sheet opens on bottom nav', async ({ page }) => {
  50 |     await loginMobile(page);
  51 |     const moreBtn = page.locator('nav button').filter({ hasText: /more/i });
  52 |     if (await moreBtn.isVisible()) {
  53 |       await moreBtn.click();
  54 |       await expect(page.getByText(/Capabilities|Settings/i)).toBeVisible({ timeout: 5000 });
  55 |     }
  56 |   });
  57 | });
  58 | 
  59 | test.describe('tablet viewport', () => {
  60 |   test.use({ viewport: { width: 810, height: 1080 } });
  61 | 
  62 |   test('page renders correctly on tablet', async ({ page }) => {
  63 |     await loginMobile(page);
  64 |     await expect(page.locator('body')).toBeVisible();
  65 |   });
  66 | });
  67 | 
```