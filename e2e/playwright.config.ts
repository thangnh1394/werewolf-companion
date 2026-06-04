import { defineConfig, devices } from '@playwright/test';

// Both dev servers must be running before executing tests:
//   npm run dev:server   (PartyKit on :1999)
//   npm run dev:client   (Vite on :5173)

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // realtime tests need sequential ordering
  retries: 0,
  workers: 1, // serialize to avoid room-code collisions
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 14 Pro'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
