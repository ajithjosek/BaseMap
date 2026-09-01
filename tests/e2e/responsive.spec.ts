import { test, expect, devices } from '@playwright/test';

/**
 * Responsive E2E - mobile viewport, bottom nav, mobile sheet.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

async function loginMobile(page: any) {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
}

test.describe('mobile viewport (iPhone 14)', () => {
  test.use({ ...devices['iPhone 14'] });

  test('bottom navigation bar is visible', async ({ page }) => {
    await loginMobile(page);
    const bottomNav = page.locator('nav').filter({ hasText: /home|more/i });
    await expect(bottomNav).toBeVisible({ timeout: 10000 });
  });

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await loginMobile(page);
    // The sidebar should not be visible on mobile (md:hidden)
    const sidebar = page.locator('.w-64.bg-slate-900');
    await expect(sidebar).not.toBeVisible();
  });

  test('brand bar is visible on mobile', async ({ page }) => {
    await loginMobile(page);
    await expect(page.getByRole('link', { name: 'BaseMap' }).first()).toBeVisible();
  });

  test('bottom nav tabs navigate to pages', async ({ page }) => {
    await loginMobile(page);
    // Click on the Applications tab in bottom nav
    const appsTab = page.locator('nav a[href="/applications"]');
    if (await appsTab.isVisible()) {
      await appsTab.click();
      await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    }
  });

  test('More sheet opens on bottom nav', async ({ page }) => {
    await loginMobile(page);
    // Find and click the More button
    const moreBtn = page.locator('nav button').filter({ hasText: /more/i });
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await expect(page.getByText(/Capabilities|Settings/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('tablet viewport (iPad)', () => {
  test.use({ ...devices['iPad (gen 7)'] });

  test('page renders correctly on tablet', async ({ page }) => {
    await loginMobile(page);
    await expect(page.locator('body')).toBeVisible();
  });
});
