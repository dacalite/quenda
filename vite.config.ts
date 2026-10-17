// SPDX-License-Identifier: EUPL-1.2
import { defineConfig } from 'vitest/config';
import optimizeLocales from '@react-aria/optimize-locales-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_DISPLAY_NAME } from './src/config/app';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/', // /<repo>/ on GitHub Pages
  plugins: [
    react(),
    // React Aria ships 34 languages; Galician is built on its Spanish strings (src/i18n/reactAria.ts).
    { ...optimizeLocales.vite({ locales: ['es-ES'] }), enforce: 'pre' },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: `${APP_DISPLAY_NAME} · Reserva de instalacións deportivas`,
        short_name: APP_DISPLAY_NAME,
        description:
          'Prototipo de reserva de instalacións deportivas municipais con datos simulados.',
        lang: 'gl',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0b2545',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // The whole interface and the local data work offline once loaded.
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 20_000,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      exclude: ['src/domain/**/*.test-utils.ts', 'src/domain/types.ts'],
      thresholds: {
        'src/domain/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
      },
    },
  },
});
