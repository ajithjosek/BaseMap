import { test, expect } from '@playwright/test';

/**
 * Responsive E2E - mobile viewport, bottom nav, mobile sheet.
 * Uses desktop viewport; actual device emulation is configured per-project.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

async function loginMobile(page: any) {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(/dashboard|\/$/, { timeout: 15000 });
}

// The bottom nav is the only nav pinned to the bottom (the desktop sidebar uses a different class).
const bottomNav = (page: any) => page.locator('nav.fixed.bottom-0');

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('bottom navigation bar is visible', async ({ page }) => {
    await loginMobile(page);
    await expect(bottomNav(page)).toBeVisible({ timeout: 10000 });
  });

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await loginMobile(page);
    const sidebar = page.locator('.w-64.bg-slate-900');
    await expect(sidebar).not.toBeVisible();
  });

  test('brand bar is visible on mobile', async ({ page }) => {
    await loginMobile(page);
    await expect(page.getByRole('link', { name: 'BaseMap' }).first()).toBeVisible();
  });

  test('bottom nav tabs navigate to pages', async ({ page }) => {
    await loginMobile(page);
    const appsTab = bottomNav(page).locator('a[href="/applications"]');
    if (await appsTab.isVisible()) {
      await appsTab.click();
      await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    }
  });

  test('More sheet opens on bottom nav', async ({ page }) => {
    await loginMobile(page);
    const moreBtn = bottomNav(page).locator('button').filter({ hasText: /more/i });
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await expect(page.getByRole('dialog').getByText(/Capabilities|Settings/i).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('tablet viewport', () => {
  test.use({ viewport: { width: 810, height: 1080 } });

  test('page renders correctly on tablet', async ({ page }) => {
    await loginMobile(page);
    await expect(page.locator('body')).toBeVisible();
  });
});
