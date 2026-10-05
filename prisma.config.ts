import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';

// Load .env.local the same way Next.js does. Prisma 7 no longer reads .env files.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations need a direct connection; Neon's pooled URL is for the app.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
