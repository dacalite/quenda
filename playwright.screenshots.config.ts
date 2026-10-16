// SPDX-License-Identifier: EUPL-1.2
import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// Screenshots for the documentation, not tests: `npm run screenshots`.
export default defineConfig({
  ...base,
  testMatch: 'screenshots.capture.ts',
  retries: 0,
  reporter: 'list',
  projects: [
    {
      name: 'mobil',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
    },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
