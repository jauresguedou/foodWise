---
title: "[Backend] Vendor store, menu item, and order status mutations"
labels: type:backend, priority:P1, feature:vendor, security, scope:mvp
parent: 4
---
## Summary

Server Actions for vendors, each checking ownership inside the same transaction as the write.

## Tasks

- [ ] `src/server/policies/stores.ts`: `assertOwnsStore(userId, storeId)`
- [ ] `createStore`, `updateStore` (new stores start `PENDING_REVIEW`; slug generated and unique)
- [ ] `saveMenuItem` (create or update), `setMenuItemAvailability`, `archiveMenuItem`
- [ ] Zod `menuItemSchema`: price > 0, student price < price, known dietary and allergen enums
- [ ] `advanceOrderStatus(orderId, nextStatus)` enforcing `PLACED → PREPARING → READY → COMPLETED` and cancel before `READY`
- [ ] `markOrderPaid(orderId)` for pay-at-pickup
- [ ] Vendor queries: `getMyStores()`, `getStoreOrders(storeId, status)`

## Acceptance criteria

- [ ] Vendor B editing vendor A's store or item is denied (test)
- [ ] Ownership comes from the session, never from a form field
- [ ] Invalid transitions (e.g. `COMPLETED → PLACED`) are rejected (unit test)
- [ ] Editing an item's price does not change existing OrderItem snapshots (test)
