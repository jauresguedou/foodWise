import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { emailOutboxDir, testDatabaseUrl } from '../../playwright.config';

// Apply migrations to the Docker test database before the app starts.
// Tests use a fresh email address each time, so nothing needs wiping.
export default async function globalSetup() {
  const host = new URL(testDatabaseUrl).hostname;
  if (!['localhost', '127.0.0.1'].includes(host)) {
    throw new Error(`TEST_DATABASE_URL must point at localhost, not ${host}.`);
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DATABASE_URL_UNPOOLED: testDatabaseUrl,
    },
  });

  await rm(emailOutboxDir, { recursive: true, force: true });
}
