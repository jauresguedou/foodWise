---
title: "[Backend] Set up PostgreSQL (Neon) and Prisma with the core schema"
labels: type:backend, priority:P1, feature:marketplace, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

Provision the database and define the five MVP entities so every other feature has somewhere to read and write. See `specs/001-foodwise-platform/architecture.md` §3.

## Tasks

- [ ] Create a Neon project; one branch per developer plus `main`
- [ ] Install Prisma and follow the current Prisma setup docs for Next.js (client generator, config file, Postgres adapter)
- [ ] Add `DATABASE_URL` to `.env.local` and document it in `.env.example` (no real values)
- [ ] Define models `User`, `Store`, `MenuItem`, `Order`, `OrderItem` and their enums in `prisma/schema.prisma`
- [ ] Add indexes and unique constraints listed in architecture.md
- [ ] Include the currency fields: `User.countryCode`, `Store.countryCode`, `Store.currency`, `Order.currency`
- [ ] Add a SQL migration for the check constraints (`priceMinor > 0`, `studentPriceMinor < priceMinor`, `quantity BETWEEN 1 AND 20`, `totalMinor >= 0`, `currency ~ '^[A-Z]{3}$'`)
- [ ] Create `src/db/client.ts` exporting a single Prisma client (reuse across hot reloads in dev)
- [ ] Add `npm` scripts: `db:migrate`, `db:studio`, `db:seed`

## Acceptance criteria

- [ ] `npx prisma migrate dev` runs cleanly on a fresh database
- [ ] Money columns are `Int` and end in `Minor`; every table with money has a `currency` column or gets it from its store
- [ ] `OrderItem.menuItemId` uses `onDelete: Restrict`; `OrderItem.orderId` uses `onDelete: Cascade`
- [ ] No secrets committed; `.env*` is git-ignored except `.env.example`
