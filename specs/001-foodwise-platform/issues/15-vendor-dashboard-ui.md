---
title: "[Frontend] Vendor dashboard, store form, and menu management"
labels: type:frontend, priority:P1, feature:vendor, accessibility, scope:mvp
parent: 4
---
## Summary

Vendor-facing pages under `/vendor`.

## Tasks

- [ ] `app/vendor/layout.tsx` calls `requireVendor()`; vendor sub-navigation
- [ ] `/vendor`: my stores with status badges; `IncomingOrdersTable` grouped by status
- [ ] `/vendor/stores/new` and `/vendor/stores/[storeId]`: `StoreForm`
- [ ] `MenuItemTable` with availability toggle, edit, archive
- [ ] `MenuItemForm` (client, `useActionState`): price inputs in the store's currency (label shows the code, e.g. "Price (USD)"), converted to minor units on the server with `toMinor()`, dietary and allergen checkboxes
- [ ] `StoreForm`: country select that defaults the currency; currency is read-only once the store has orders
- [ ] `/vendor/orders/[orderId]`: line items, advance status, mark paid

## Acceptance criteria

- [ ] Field-level errors shown next to each field and announced
- [ ] Price input rejects more decimal places than the currency allows (2 for USD, 0 for JPY)
- [ ] Table actions have accessible names (e.g. "Archive Veggie Bowl", not just an icon)
- [ ] E2E test: vendor creates an item and it appears on `/stores/[storeSlug]` once the store is published
