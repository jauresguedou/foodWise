# FoodWise

FoodWise is a web app that helps students find affordable meals, order food, and pay at student prices.

Team members: Jaures Guedou, Charles Ukoh, Nicholas Kigozi, Ronald Mullo

Scope and decisions live in [`specs/001-foodwise-platform/`](specs/001-foodwise-platform/): start with `spec.md` and `architecture.md`.

## Getting started

You need Node.js 24 (see `.nvmrc`).

```bash
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

PostgreSQL on Neon, through Prisma 7. `npm install` generates the Prisma client.

1. In the Neon console, create your own branch of the FoodWise database. Never share one dev database.
2. Copy `.env.example` to `.env.local`. Paste your branch's pooled URL into `DATABASE_URL` and its direct URL into `DATABASE_URL_UNPOOLED`.
3. Run `npm run db:migrate` to apply migrations.

Integration tests use a throwaway Postgres in Docker instead of Neon:

```bash
npm run db:test:up          # start it (needs Docker Desktop running)
npm run test:integration
npm run db:test:down        # stop it; data is discarded
```

## Sign-in

Passwordless: FoodWise emails a 6-digit code, and stores no passwords. A verified address on a domain in `STUDENT_EMAIL_DOMAINS` gets student prices.

1. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `STUDENT_EMAIL_DOMAINS` in `.env.local` (see `.env.example`).
2. In development, leave `RESEND_API_KEY` empty. Sign-in codes print in the terminal running `npm run dev`.

How it fits together:

- `src/server/actions/auth.ts`: `register`, `requestSignInCode`, `verifySignInCode`, `signOut`. There is no `/api/auth` route; only these actions call Better Auth.
- `src/auth/session.ts`: `getSession`, `requireUser`, `requireVerifiedStudent`, `requireVendor`. Call one in **every** protected page, Server Action, and query. `proxy.ts` only redirects for convenience.
- Rate limits: 5 wrong codes, or 5 codes sent, per email per 15 minutes (`src/server/rate-limit.ts`).
- `SecurityEvent` records sign-ins and denied access. It never stores an email address, only a keyed hash.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check with no output |
| `npm run lint` | ESLint |
| `npm run format` | Format code with Prettier (`format:check` only checks) |
| `npm test` | Unit tests with Vitest (`test:watch` to re-run on save) |
| `npm run test:integration` | Integration tests against the Docker database |
| `npm run test:e2e` | Builds the app, then runs Playwright and axe accessibility checks |
| `npm run db:migrate` | Create and apply migrations on your dev branch |
| `npm run db:deploy` | Apply existing migrations (CI and deploys) |
| `npm run db:studio` | Browse data in Prisma Studio |

CI runs typecheck, lint, format check, unit tests, build, and the end-to-end suite on every pull request. Run the same commands locally before you push.

## Tests

- `tests/unit`: pure logic and client components (Vitest, jsdom)
- `tests/integration`: queries, actions, and database rules against real Postgres
- `tests/e2e`: full journeys in a real browser (Playwright), with axe on each page
