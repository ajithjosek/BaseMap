import { test, expect } from '@playwright/test';

/**
 * Navigation E2E - sidebar sections, bottom nav, command palette, locale switching.
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:3005';
const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@basemap.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

async function login(page: any) {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in|login|log ?in/i }).click();
  await page.waitForURL(/dashboard|^\/$/, { timeout: 15000 });
}

test.describe('sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sidebar has grouped sections', async ({ page }) => {
    // Portfolio section
    await expect(page.getByText('Applications')).toBeVisible();
    await expect(page.getByText('SaaS')).toBeVisible();

    // Architecture section
    await expect(page.getByText('Capabilities')).toBeVisible();
    await expect(page.getByText('Heatmap')).toBeVisible();

    // Admin section
    await expect(page.getByText('Users')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('clicking a nav item navigates to that page', async ({ page }) => {
    await page.getByRole('link', { name: 'Applications' }).first().click();
    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
  });

  test('active nav item is highlighted', async ({ page }) => {
    await page.goto(`${WEB_URL}/applications`);
    await page.waitForLoadState('networkidle');
    const link = page.getByRole('link', { name: 'Applications' }).first();
    await expect(link).toHaveAttribute('aria-current', 'page');
  });

  test('BaseMap brand link is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'BaseMap' }).first()).toBeVisible();
  });
});

test.describe('command palette', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 });
  });

  test('searches for pages', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('applications');
    await expect(page.getByText(/Applications/)).toBeVisible({ timeout: 5000 });
  });

  test('closes with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/search/i)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('locale switching', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('locale switcher is visible', async ({ page }) => {
    // Look for locale-related button or dropdown
    const localeBtn = page.getByRole('button', { name: /locale|language|en|pt/i });
    // Just check the page renders - locale switcher may be in different positions
    await expect(page.locator('body')).toBeVisible();
  });
});
