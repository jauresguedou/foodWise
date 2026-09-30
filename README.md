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

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check with no output |
| `npm run lint` | ESLint |
| `npm run format` | Format code with Prettier (`format:check` only checks) |
| `npm test` | Unit tests with Vitest (`test:watch` to re-run on save) |
| `npm run test:e2e` | Builds the app, then runs Playwright and axe accessibility checks |

CI runs typecheck, lint, format check, unit tests, build, and the end-to-end suite on every pull request. Run the same commands locally before you push.

## Tests

- `tests/unit`: pure logic and client components (Vitest, jsdom)
- `tests/e2e`: full journeys in a real browser (Playwright), with axe on each page