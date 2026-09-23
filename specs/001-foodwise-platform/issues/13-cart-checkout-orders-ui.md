---
title: "[Frontend] Cart, checkout, and order status pages"
labels: type:frontend, priority:P1, feature:orders, accessibility, scope:mvp
parent: 3
---
## Summary

The student side of ordering: `/cart`, `/checkout`, `/orders`, `/orders/[orderId]`.

## Tasks

- [ ] `AddToCartForm` (client) on the meal detail page; "cart has items from another store" Dialog
- [ ] `CartButton` in the header shows item count
- [ ] `/cart`: `CartLineItem` with quantity controls, `CartSummary` (subtotal, student savings, total)
- [ ] `/checkout`: pickup store and hours, optional pickup note, final total, "Place order (pay at pickup)" button carrying the idempotency key
- [ ] Show a notice if any price or availability changed since the item was added
- [ ] `/orders` list with `OrderCard` and `OrderStatusBadge`; `/orders/[orderId]` receipt with line snapshots
- [ ] Disable the submit button while pending, but rely on the idempotency key for safety

## Acceptance criteria

- [ ] Total, savings, and payment status are visible without scrolling on mobile
- [ ] Quantity controls work by keyboard and announce the new quantity
- [ ] E2E test: verified student goes from `/meals` to a placed order
- [ ] E2E test: unverified student sees the verification notice instead of checkout
