// SPDX-License-Identifier: EUPL-1.2
// Renders the PWA icons from public/icons/icon.svg with the browser Playwright already installs.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

for (const [file, size, padding] of [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  // Maskable icons keep their content inside the central 80 % safe zone.
  ['maskable-512.png', 512, 0.1],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:#0b5cad;display:grid;place-items:center;height:100vh">
       <div style="width:${String(100 - padding * 200)}%">${svg}</div></body>`,
  );
  await page.screenshot({ path: `public/icons/${file}` });
}
await browser.close();
