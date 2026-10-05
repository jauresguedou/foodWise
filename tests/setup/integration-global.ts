import { execSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

// Apply pending migrations to the test database once per run. The compose
// container keeps data in memory, so `npm run db:test:down` then `db:test:up`
// gives a clean database if a migration was edited.
export default function setup(project: TestProject) {
  const url = project.config.env.DATABASE_URL;
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
  });
}
