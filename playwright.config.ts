// SPDX-License-Identifier: EUPL-1.2
import { defineConfig, devices } from '@playwright/test';

const PORT = '4173';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // axe takes several seconds per page on a busy machine, and some tests run it at every step.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'gl-ES',
    trace: 'retain-on-failure',
    // The guided tours open by themselves on a first visit; each test that needs one starts it.
    storageState: 'e2e/storage-state.json',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
