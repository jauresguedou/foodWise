# FoodWise: Copilot instructions

FoodWise is a web app where students find affordable meals from campus food vendors, see student prices, and order for pickup. Vendors manage their stores and menus. Full decisions: `specs/001-foodwise-platform/spec.md` (scope) and `specs/001-foodwise-platform/architecture.md` (routes, components, data model, theme). Engineering principles: `.specify/memory/constitution.md`.

## Stack

- **Next.js 16** App Router, **React 19**, **TypeScript 5** (strict)
- **Tailwind CSS v4** (tokens in `app/globals.css` via `@theme`), **shadcn/ui**, **lucide-react**
- **PostgreSQL** on Neon, **Prisma ORM**
- **Better Auth** (passwordless email codes; no passwords stored), **Zod** for all input validation
- **Vitest** for unit/integration tests, **Playwright** + `@axe-core/playwright` for e2e and accessibility
- Prettier and ESLint; run `npm run lint` and `npx tsc --noEmit` before committing

## Next.js 16 differs from older versions

Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code. In particular:

- `middleware.ts` is now **`proxy.ts`**. Use it only for convenience redirects. It is never the security check.
- `params` and `searchParams` are **Promises**. Always `await` them.
- Type pages and layouts with the global helpers: `PageProps<'/meals/[menuItemId]'>`, `LayoutProps<'/'>`.
- Do not use the Pages Router, `getServerSideProps`, or `getStaticProps`.

## Project structure

```text
app/                    routes only (pages, layouts, route handlers)
  (auth)/ (shop)/ (student)/ vendor/ api/
src/auth/               Better Auth config and session helpers
src/db/client.ts        the single Prisma client
src/server/queries/     read functions for Server Components
src/server/actions/     "use server" mutations
src/server/policies/    ownership and permission checks
src/validation/         Zod schemas
src/lib/                money.ts, utils
src/components/ui/      shadcn/ui primitives
src/components/<feature>/  layout, meals, stores, cart, orders, vendor, auth, shared
prisma/                 schema.prisma, migrations, seed.ts
tests/                  unit, integration, e2e
```

The import alias `@/` points to the repo root, so shared code is imported as `@/src/components/meals/MealCard`. Components used by one route only go in that route's `_components/` folder.

## Naming

- Components: PascalCase file and export, one component per file, **named exports** (`export function MealCard`). Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, etc.).
- Functions and variables: camelCase, verbs for functions (`getMeals`, `placeOrder`, `assertOwnsStore`).
- Queries start with `get`; actions are verbs (`addToCart`, `saveMenuItem`); policies start with `assert` or `can`.
- Zod schemas: `somethingSchema`; inferred types: `type Something = z.infer<typeof somethingSchema>`.
- Route segments kebab-case. Dynamic params name the entity: `[menuItemId]`, `[storeSlug]`, `[orderId]`. Never `[id]`.
- Prisma models singular PascalCase (`MenuItem`); fields camelCase; enums SCREAMING_CASE values.
- Money fields end in `Minor`, booleans start with `is`/`has`, timestamps end in `At`.
- Use the domain words consistently: **student**, **vendor**, **store**, **menu item** (UI copy may say "meal"), **order**, **student price**. Do not mix in "product", "seller", "restaurant", or "customer".

## Data model (MVP)

`User` (role `STUDENT | VENDOR | ADMIN`, `studentVerifiedAt`, `countryCode`) → owns `Store` (`slug`, `campus`, `countryCode`, `currency`, `status`) → has `MenuItem` (`priceMinor`, `studentPriceMinor?`, `dietaryTags[]`, `allergens[]`, `isAvailable`, `archivedAt?`). `User` places `Order` (`status`, `paymentStatus`, `subtotalMinor`, `discountMinor`, `totalMinor`, `currency`, `idempotencyKey`) for one `Store`. `OrderItem` joins `Order` and `MenuItem` and snapshots `nameSnapshot`, `basePriceMinor`, `unitPriceMinor`, `lineTotalMinor`.

Order status: `PLACED → PREPARING → READY → COMPLETED`, or `CANCELLED` before `READY`. Payment: `UNPAID | PAID | REFUNDED` (MVP is pay at pickup).

## Rules that must never be broken

**Types**
- No `any`, explicit or implicit. Use `unknown` and narrow, or validate with Zod.
- Validate every external input with Zod: form data, search params, route params, cookies, webhook bodies.

**Money**
- Money is an integer count of the currency's minor unit (`Int` in Prisma, fields ending in `Minor`). Never floats, never `toFixed` for math.
- Every amount travels with its ISO 4217 `currency` code. Never assume USD or two decimal places: JPY has none.
- Each store has one currency. Prices, orders, and payments use the store's currency. There is no conversion. An order's `currency` is copied from the store, never taken from input.
- Never add or compare amounts in different currencies.
- Format for display only with `formatMoney(amountMinor, currency, locale)` from `src/lib/money.ts` (wraps `Intl.NumberFormat`). Parse vendor input with `toMinor()`, which uses the currency's decimal places.
- Prices, discounts, and totals are calculated on the server from database values. Never trust a price, total, or eligibility flag from the client.

**Server and client boundaries**
- Pages and layouts are Server Components. Add `"use client"` only to leaf components that need state, effects, or browser events (filters, forms, dialogs, cart button).
- Server Components read data by calling `src/server/queries/*` directly. Do not `fetch` your own API routes.
- Mutations are Server Actions in `src/server/actions/*`. Route Handlers are for webhooks and health checks only.
- Never import `src/db`, `src/server`, or secrets into a client component.
- Select only the fields the UI needs. Never return session tokens, sign-in codes, or `SecurityEvent` rows to the client.
- Only `src/server/actions/auth.ts` calls Better Auth's `auth.api`. Do not add an `/api/auth` route; it would bypass consent and the per-email rate limits.

**Authorization**
- Every Server Action and protected query checks the session itself with `requireUser()`, `requireVerifiedStudent()`, or `requireVendor()`, even if `proxy.ts` or a layout already redirected.
- Ownership comes from the session, never from a form field. Check it with `src/server/policies/*` inside the same transaction as the write.
- When a user asks for a record they don't own, respond as if it does not exist (`notFound()`).

**Orders**
- `placeOrder` runs in one Prisma transaction and uses the order's `idempotencyKey`, so a double submit returns the existing order.
- Never delete a menu item that has been ordered; set `archivedAt`.

## UI and styling

- Tailwind utility classes only. Use theme tokens (`bg-primary`, `text-muted-foreground`, `bg-deal`, `border-border`), never raw hex values in components. Token table: architecture.md §4.
- Palette: warm off-white `background`, green `primary` for actions and links, `primary-dark` for nav and headers, amber `deal` for student-price badges, `destructive` for errors.
- Amber `deal` is a **background only**, always with `text-foreground` on it. Never use it for text or icons. Orange `promo` is for fills and large text; use `promo-text` for normal-size orange text.
- Fonts: `font-display` (Plus Jakarta Sans) for headings, `font-sans` (Inter) for everything else, `tabular-nums font-semibold` for prices, `font-mono` (JetBrains Mono) for order numbers and IDs only.
- Layout: `Container` (`mx-auto max-w-page px-4 sm:px-6 lg:px-8`, 1200px max), mobile-first, `lg:grid-cols-12` for pages with sidebars, spacing steps 1, 2, 3, 4, 5, 6, 8, 10, 12 only.
- Cards `rounded-xl border shadow-sm`, buttons and inputs `rounded-lg`, badges `rounded-full`.
- Use shadcn/ui primitives from `src/components/ui` before writing a new interactive widget.

## Accessibility (part of done, not a follow-up)

- Semantic HTML first: `button` for actions, `a`/`Link` for navigation, real `label` for every input.
- Never convey meaning by color alone. Dietary tags, allergens, statuses, and savings need text.
- Visible focus (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`), 44px minimum touch targets.
- Form errors: tie to the field with `aria-describedby`, announce with `aria-live`, move focus to the first error.
- Icons are `aria-hidden="true"`; icon-only buttons need `aria-label`.
- Meal images need descriptive `alt`; use `next/image`.
- No horizontal scroll at 320px wide.

## Forms

Client form component + Server Action + Zod schema. Use `useActionState` for pending state and errors. Actions return a typed result such as `{ ok: true, data } | { ok: false, fieldErrors, message }`; they do not throw for validation failures.

## Testing

- Unit test money math, Zod schemas, status transitions, and policies (`tests/unit`).
- Integration test queries and actions against a test database, including a "wrong user" case for anything with ownership (`tests/integration`).
- E2E test full journeys with seeded data and run axe on each page (`tests/e2e`).
- Never use real student data or real payment keys in tests or seeds.

## Git

- Branch from `main`: `feature/<issue-number>-short-slug` or `fix/<issue-number>-short-slug`.
- Conventional Commits: `feat(meals): add FilterBar`, `fix(cart): reject items from a second store`.
- One issue per PR. PR description links the issue (`Closes #12`), lists how it was tested, and notes any risk.
- Never commit `.env*` files (except `.env.example`), secrets, or generated Prisma client code.
