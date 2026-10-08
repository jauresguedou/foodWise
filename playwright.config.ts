import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Its own port, and never reused, so a dev server on :3000 that points at
// Neon can never receive test traffic.
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://foodwise:foodwise@localhost:5433/foodwise_test';

// Sign-in codes land here as JSON files; tests/e2e/helpers/auth.ts reads them.
export const emailOutboxDir = path.resolve('test-results/email-outbox');

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Tests run against a production build, as the Next.js testing guide recommends.
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    // Set here, these win over anything in .env.local.
    env: {
      DATABASE_URL: testDatabaseUrl,
      DATABASE_URL_UNPOOLED: testDatabaseUrl,
      BETTER_AUTH_SECRET: 'e2e-tests-only-secret-0123456789abcdef',
      BETTER_AUTH_URL: baseURL,
      STUDENT_EMAIL_DOMAINS: 'byupathway.edu',
      EMAIL_TRANSPORT: 'file',
      EMAIL_OUTBOX_DIR: emailOutboxDir,
      RESEND_API_KEY: '',
    },
  },
});
