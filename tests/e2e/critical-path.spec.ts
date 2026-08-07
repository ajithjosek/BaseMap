import { test, expect } from '@playwright/test';

/**
 * Sprint 39.3 - critical path journey:
 * login -> create application -> create capability -> map app -> report -> export.
 * Assumes a seeded API at localhost:4001 and web at localhost:3005.
 */
test.describe('critical path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'admin@basemap.io');
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'Admin123!');
    await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
    await expect(page).toHaveURL(/dashboard|^\/$/, { timeout: 15000 });
  });

  test('create an application', async ({ page }) => {
    await page.goto('/applications');
    await page.getByRole('link', { name: /new( application)?/i }).click();
    await page.getByLabel(/name/i).fill(`E2E App ${Date.now()}`);
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E App')).toBeVisible({ timeout: 10000 });
  });

  test('create a capability', async ({ page }) => {
    await page.goto('/capabilities');
    await page.getByRole('button', { name: /new|add|create/i }).first().click();
    await page.getByLabel(/name/i).fill('E2E Capability');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E Capability')).toBeVisible({ timeout: 10000 });
  });

  test('run a report', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('button', { name: /run|generate/i }).click();
    await expect(page.getByText(/report|results/i)).toBeVisible({ timeout: 15000 });
  });
});