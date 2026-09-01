# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> authentication >> sidebar shows all navigation sections after login
- Location: auth.spec.ts:41:7

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
  4  |  * Auth E2E - login, register, logout, role-based nav visibility.
  5  |  * Assumes seeded API at localhost:4001 and web at localhost:3005.
  6  |  */
  7  | 
  8  | const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
  9  | const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
  10 | const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';
  11 | 
  12 | test.describe('authentication', () => {
  13 |   test('login page renders email and password fields', async ({ page }) => {
  14 |     await page.goto(`${WEB_URL}/login`);
  15 |     await expect(page.getByLabel(/email/i)).toBeVisible();
  16 |     await expect(page.getByLabel(/password/i)).toBeVisible();
  17 |     await expect(page.getByRole('button', { name: /sign in|login|log ?in/i })).toBeVisible();
  18 |   });
  19 | 
  20 |   test('login with valid credentials redirects to dashboard', async ({ page }) => {
  21 |     await page.goto(`${WEB_URL}/login`);
  22 |     await page.getByLabel(/email/i).fill(TEST_EMAIL);
  23 |     await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  24 |     await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  25 |     await expect(page).toHaveURL(/dashboard|^\/$/, { timeout: 15000 });
  26 |   });
  27 | 
  28 |   test('login with invalid credentials shows error', async ({ page }) => {
  29 |     await page.goto(`${WEB_URL}/login`);
  30 |     await page.getByLabel(/email/i).fill('wrong@example.com');
  31 |     await page.getByLabel(/password/i).fill('wrongpassword');
  32 |     await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  33 |     await expect(page.getByText(/invalid|error|unauthorized/i)).toBeVisible({ timeout: 10000 });
  34 |   });
  35 | 
  36 |   test('unauthenticated user is redirected to login', async ({ page }) => {
  37 |     await page.goto(`${WEB_URL}/applications`);
  38 |     await expect(page).toHaveURL(/login/, { timeout: 10000 });
  39 |   });
  40 | 
  41 |   test('sidebar shows all navigation sections after login', async ({ page }) => {
> 42 |     await page.goto(`${WEB_URL}/login`);
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3005/login
  43 |     await page.getByLabel(/email/i).fill(TEST_EMAIL);
  44 |     await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  45 |     await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  46 |     await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
  47 | 
  48 |     // Check sidebar sections exist
  49 |     await expect(page.getByText('Applications')).toBeVisible();
  50 |     await expect(page.getByText('Capabilities')).toBeVisible();
  51 |   });
  52 | });
  53 | 
```