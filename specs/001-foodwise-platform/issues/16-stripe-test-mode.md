---
title: "[Backend] Stripe Checkout in test mode with verified webhooks (stretch)"
labels: type:backend, priority:P2, feature:payments, security, scope:stretch
parent: 3
---
## Summary

Replace pay-at-pickup with Stripe-hosted Checkout in test mode. Only start after the MVP ordering flow is done.

## Tasks

- [ ] Add `WebhookEvent` model (`providerEventId` unique, type, payloadHash, processedAt)
- [ ] `placeOrder` creates a Stripe Checkout Session using the server-computed total; stores `stripeCheckoutSessionId`
- [ ] `app/api/webhooks/stripe/route.ts`: verify signature with the raw body, persist the event, skip if already processed
- [ ] `checkout.session.completed` sets `paymentStatus = PAID`; expired or failed sessions leave the order `UNPAID` and cancel it
- [ ] Success page reads order status from the database; the return URL is not proof of payment

## Acceptance criteria

- [ ] Replaying the same webhook event changes nothing (test with fixtures)
- [ ] An invalid signature returns 400 and writes nothing
- [ ] Stripe keys live only in server env vars; nothing Stripe-secret in client bundles
