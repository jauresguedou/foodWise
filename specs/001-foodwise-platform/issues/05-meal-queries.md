---
title: "[Backend] Meal and store read queries with filters"
labels: type:backend, priority:P1, feature:marketplace, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

Server-side read functions for discovery. Server Components call these directly; no API route needed.

## Tasks

- [ ] `src/server/queries/meals.ts`: `getMeals(filters)`, `getMealById(menuItemId)`
- [ ] `src/server/queries/stores.ts`: `getStores(filters)`, `getStoreBySlug(storeSlug)` including its menu
- [ ] Zod schema `mealFiltersSchema` in `src/validation/` for `q`, `campus`, `dietary[]`, `maxPriceMinor`, `storeSlug`, `page`. `maxPriceMinor` is ignored unless `campus` is set, so every result shares one currency
- [ ] Default `campus` from the signed-in user's `countryCode` when none is given
- [ ] Only return items where the store is `PUBLISHED` and `archivedAt` is null
- [ ] Unavailable items are returned with `isAvailable: false` (shown as unavailable, not hidden) on store pages; excluded from `/meals` results by default
- [ ] Paginate: 24 per page, return `totalCount`
- [ ] Select only fields the UI needs (never `passwordHash` or owner email). Always include the store's `currency` with prices
- [ ] Use `effectivePriceMinor(item, isVerifiedStudent)` and `formatMoney` from the money module (see the multi-currency issue)

## Acceptance criteria

- [ ] Unit tests for `mealFiltersSchema` (bad input falls back to defaults, never throws to the page)
- [ ] Unit tests for `effectivePriceMinor`
- [ ] Integration test: a `PENDING_REVIEW` store's items never appear
