import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://foodwise:foodwise@localhost:5433/foodwise_test';

// Integration tests wipe the database, so never let them near Neon.
const testDatabaseHost = new URL(testDatabaseUrl).hostname;
if (!['localhost', '127.0.0.1'].includes(testDatabaseHost)) {
  throw new Error(
    `TEST_DATABASE_URL must point at localhost, not ${testDatabaseHost}.`
  );
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': rootDir,
      // The real package throws outside a React Server Components bundle.
      'server-only': `${rootDir}tests/setup/empty-module.ts`,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['tests/setup/unit.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          env: {
            DATABASE_URL: testDatabaseUrl,
            DATABASE_URL_UNPOOLED: testDatabaseUrl,
          },
          globalSetup: ['tests/setup/integration-global.ts'],
          // One shared database, so test files run one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
});
