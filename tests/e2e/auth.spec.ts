import { test, expect } from '@playwright/test';

/**
 * Auth E2E - login, register, logout, role-based nav visibility.
 * Assumes seeded API at localhost:4001 and web at localhost:3005.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

test.describe('authentication', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/dashboard|\/$/, { timeout: 15000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // The destructive Alert (role="alert") inside the form surfaces the 401.
    await expect(page.locator('form').getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto(`${WEB_URL}/applications`);
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('sidebar shows all navigation sections after login', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL(/dashboard|\/$/, { timeout: 15000 });

    // Check sidebar sections exist (first() = the sidebar, not the mobile bottom nav).
    await expect(page.getByText('Applications').first()).toBeVisible();
    await expect(page.getByText('Capabilities').first()).toBeVisible();
  });
});
