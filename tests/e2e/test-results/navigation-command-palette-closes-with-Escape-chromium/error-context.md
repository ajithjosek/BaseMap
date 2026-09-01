# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> command palette >> closes with Escape
- Location: navigation.spec.ts:72:7

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
  4  |  * Navigation E2E - sidebar sections, bottom nav, command palette, locale switching.
  5  |  */
  6  | 
  7  | const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
  8  | const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
  9  | const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';
  10 | 
  11 | async function login(page: any) {
> 12 |   await page.goto(`${WEB_URL}/login`);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
  13 |   await page.getByLabel(/email/i).fill(TEST_EMAIL);
  14 |   await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  15 |   await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  16 |   await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
  17 | }
  18 | 
  19 | test.describe('sidebar navigation', () => {
  20 |   test.beforeEach(async ({ page }) => {
  21 |     await login(page);
  22 |   });
  23 | 
  24 |   test('sidebar has grouped sections', async ({ page }) => {
  25 |     // Portfolio section
  26 |     await expect(page.getByText('Applications')).toBeVisible();
  27 |     await expect(page.getByText('SaaS')).toBeVisible();
  28 | 
  29 |     // Architecture section
  30 |     await expect(page.getByText('Capabilities')).toBeVisible();
  31 |     await expect(page.getByText('Heatmap')).toBeVisible();
  32 | 
  33 |     // Admin section
  34 |     await expect(page.getByText('Users')).toBeVisible();
  35 |     await expect(page.getByText('Settings')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('clicking a nav item navigates to that page', async ({ page }) => {
  39 |     await page.getByRole('link', { name: 'Applications' }).first().click();
  40 |     await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  41 |   });
  42 | 
  43 |   test('active nav item is highlighted', async ({ page }) => {
  44 |     await page.goto(`${WEB_URL}/applications`);
  45 |     await page.waitForLoadState('networkidle');
  46 |     const link = page.getByRole('link', { name: 'Applications' }).first();
  47 |     await expect(link).toHaveAttribute('aria-current', 'page');
  48 |   });
  49 | 
  50 |   test('BaseMap brand link is visible', async ({ page }) => {
  51 |     await expect(page.getByRole('link', { name: 'BaseMap' }).first()).toBeVisible();
  52 |   });
  53 | });
  54 | 
  55 | test.describe('command palette', () => {
  56 |   test.beforeEach(async ({ page }) => {
  57 |     await login(page);
  58 |   });
  59 | 
  60 |   test('opens with Ctrl+K', async ({ page }) => {
  61 |     await page.keyboard.press('Control+k');
  62 |     await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 });
  63 |   });
  64 | 
  65 |   test('searches for pages', async ({ page }) => {
  66 |     await page.keyboard.press('Control+k');
  67 |     const searchInput = page.getByPlaceholder(/search/i);
  68 |     await searchInput.fill('applications');
  69 |     await expect(page.getByText(/Applications/)).toBeVisible({ timeout: 5000 });
  70 |   });
  71 | 
  72 |   test('closes with Escape', async ({ page }) => {
  73 |     await page.keyboard.press('Control+k');
  74 |     await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 });
  75 |     await page.keyboard.press('Escape');
  76 |     await expect(page.getByPlaceholder(/search/i)).not.toBeVisible({ timeout: 5000 });
  77 |   });
  78 | });
  79 | 
  80 | test.describe('locale switching', () => {
  81 |   test.beforeEach(async ({ page }) => {
  82 |     await login(page);
  83 |   });
  84 | 
  85 |   test('locale switcher is visible', async ({ page }) => {
  86 |     // Look for locale-related button or dropdown
  87 |     const localeBtn = page.getByRole('button', { name: /locale|language|en|pt/i });
  88 |     // Just check the page renders - locale switcher may be in different positions
  89 |     await expect(page.locator('body')).toBeVisible();
  90 |   });
  91 | });
  92 | 
```