import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

// End-to-end suite (spec §11). Vitest owns tests/**/*.test.ts; Playwright
// owns e2e/**/*.spec.ts, so neither runner picks up the other's files.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The Next binary directly, not `pnpm dev`: pnpm doesn't pass Playwright's
    // stop signal to its child, so teardown hung and left `next dev` running.
    command: `node_modules/.bin/next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
