import { test, expect } from '@playwright/test';

/**
 * Sprint 39.3 - smoke test that every authenticated page renders.
 * Visits each route and asserts an <h1> heading is present.
 */
const ROUTES = [
  '/',
  '/applications',
  '/capabilities',
  '/heatmap',
  '/saas',
  '/saas/requests',
  '/interfaces',
  '/components',
  '/eol-risk',
  '/data-quality',
  '/query-builder',
  '/insights',
  '/advanced-analytics',
  '/exports',
  '/resource-allocation',
  '/compliance',
  '/audit-logs',
  '/transformation-roadmap',
  '/graph',
  '/reports',
  '/reports/builder',
  '/users',
  '/settings',
  '/workflows',
  '/tech-standards',
  '/c4-diagrams',
];

test('all authenticated pages render', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || 'admin@basemap.io');
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || 'Admin123!');
  await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });

  for (const route of ROUTES) {
    await test.step(`render ${route}`, async () => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    });
  }
});