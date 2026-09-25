---
title: "[Backend] Cart and order placement Server Actions"
labels: type:backend, priority:P1, feature:orders, security, scope:mvp
parent: 3
---
## Summary

Cart stored in an HTTP-only cookie; orders placed in one transaction with server-calculated totals and an idempotency key.

## Tasks

- [ ] `src/server/actions/cart.ts`: `addToCart`, `updateCartQuantity`, `removeFromCart`, `clearCart`. Cookie holds only `{ storeId, lines: [{ menuItemId, quantity }] }`
- [ ] Adding an item from a different store returns a `DIFFERENT_STORE` result so the UI can ask to clear the cart
- [ ] `src/server/queries/cart.ts`: `getCart()` re-reads items and prices from the database
- [ ] `src/server/actions/orders.ts`: `placeOrder(idempotencyKey)` requires a verified student; in one transaction re-checks availability, computes subtotal, discount, and total as integer minor units, copies `currency` from the store, writes Order and OrderItem snapshots
- [ ] Same `idempotencyKey` twice returns the first order, no duplicate
- [ ] `src/server/queries/orders.ts`: `getMyOrders()`, `getMyOrder(orderId)` scoped to the signed-in student

## Acceptance criteria

- [ ] Unit tests for total calculation (with and without student prices, mixed quantities)
- [ ] Integration test: unavailable item at checkout returns a clear error and no order
- [ ] Integration test: duplicate submit creates exactly one order
- [ ] Integration test: student B cannot read student A's order (returns not found)
