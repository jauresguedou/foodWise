---
title: "[Backend] Seed script with sample stores, meals, and test users"
labels: type:backend, priority:P1, feature:marketplace, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

Realistic seed data lets the frontend build against real queries and gives the e2e tests a known starting state.

## Tasks

- [ ] Write `prisma/seed.ts` and wire it to `npm run db:seed`
- [ ] Seed 3 vendors, each owning 1–2 stores on at least two campuses
- [ ] Most stores in the US with `USD`; one store in another country and currency (e.g. a `CAD` campus store) so multi-currency paths get exercised
- [ ] At least one store in `PENDING_REVIEW` (must not appear publicly)
- [ ] ~30 menu items across categories, mixing: with and without `studentPriceMinor`, several dietary tags and allergens, some `isAvailable: false`, one archived
- [ ] Test users: one verified student, one unverified student, one vendor, one admin; passwords from an env var, hashed with bcrypt
- [ ] Seed is idempotent (upsert by email and slug) so it can run twice

## Acceptance criteria

- [ ] `npm run db:seed` on an empty database produces the data above
- [ ] Running it a second time does not create duplicates
- [ ] Test credentials are documented in the README for local use only
