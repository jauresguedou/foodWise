---
title: "[Frontend] /meals browse page with MealCard, MealGrid, FilterBar, and PriceTag"
labels: type:frontend, priority:P1, feature:marketplace, accessibility, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

The Week 04 demo: a student can browse and filter affordable meals.

## Tasks

- [ ] `app/(shop)/meals/page.tsx` as a Server Component; await `searchParams` and pass to `getMeals()`
- [ ] `MealCard`: image, name, store name, `PriceTag`, `DietaryTags`; whole card is one link to `/meals/[menuItemId]`
- [ ] `MealGrid`: responsive grid, `EmptyState` when no results
- [ ] `PriceTag`: base price struck through, student price on an amber `deal` badge with dark text, and "Save {amount} with student ID" text formatted with `formatMoney` in the store's currency; handles items without a student price
- [ ] Max-price filter is hidden until a campus is selected
- [ ] `DietaryTags`: text badges with icons
- [ ] `FilterBar` (client): search, campus, dietary checkboxes, max price; updates URL search params with `router.replace`, debounced search
- [ ] `Pagination` using search params
- [ ] `loading.tsx` with Skeleton cards

## Acceptance criteria

- [ ] Filters survive a page reload and a shared link
- [ ] All filter controls have visible labels and work by keyboard
- [ ] Dietary info and savings are readable without color
- [ ] Result count is announced to screen readers when filters change (`aria-live="polite"`)
- [ ] No horizontal scroll at 320px
