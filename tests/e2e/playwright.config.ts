import { defineConfig, devices } from '@playwright/test';

/**
 * Sprint 39.3 - E2E test suite (Playwright).
 * Smoke tests for all pages + a critical-path journey.
 *
 * Requires the web app running at WEB_URL and the API at API_URL.
 *   npx playwright install
 *   npx playwright test
 */
export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.WEB_URL || 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});