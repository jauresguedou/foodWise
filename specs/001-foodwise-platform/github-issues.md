# FoodWise GitHub Issues

GitHub CLI is not installed in the current environment, so these P1 stories are prepared as issue-ready drafts. Create one GitHub issue per section using the title, body, and labels below.

## Issue 1: Student Account and Eligibility

**Labels**: `priority:P1`, `feature:identity`, `security`

### User Story

As a student, I want to create a secure account and verify my student eligibility so that I can access student prices and protected support features.

### Acceptance Criteria

- [ ] A new student can register or sign in through the approved identity provider.
- [ ] Required consent is shown before account creation and the student can understand what data is collected.
- [ ] The server creates a secure session using HTTP-only, same-site cookies.
- [ ] A student cannot use student-only prices or support workflows until eligibility is verified.
- [ ] A verified student can access only their own profile, orders, support applications, financial records, and tracker data.
- [ ] Failed authentication or verification attempts are rate-limited after the configured threshold.
- [ ] Security events are recorded without exposing credentials or sensitive eligibility data.
- [ ] Unit, integration, authorization-matrix, and end-to-end tests cover the accepted and denied paths.
- [ ] The flow is keyboard-operable, has visible focus, labels all fields, and exposes validation errors accessibly.

### Security Notes

Authorization must be enforced in server actions and route handlers. Middleware redirects are a user-experience aid, not the security boundary. Do not store passwords or sensitive provider secrets in FoodWise.

## Issue 2: Discover Affordable Meals

**Labels**: `priority:P1`, `feature:marketplace`, `accessibility`

### User Story

As a student, I want to browse nearby stores and menus with student prices, availability, dietary information, and pickup or delivery options so that I can find an affordable meal quickly.

### Acceptance Criteria

- [ ] Published stores and menu items are displayed using server-side data reads.
- [ ] Each available item shows its base price, eligible student price or discount, availability, and fulfillment options.
- [ ] Unavailable or unpublished items cannot be added to a new order.
- [ ] Dietary and allergen information is presented as accessible text and is not conveyed by color alone.
- [ ] Students can search and filter menus without horizontal scrolling on supported mobile and desktop viewports.
- [ ] Keyboard users can operate search, filters, store navigation, and item details.
- [ ] Published menu versions are immutable for existing order snapshots.
- [ ] Read paths are paginated or bounded and meet the agreed performance target under seeded load.
- [ ] Tests cover availability, publication windows, pricing display, filtering, authorization, and accessibility.

### Implementation Notes

Use Server Components for the initial read path. Client Components should be limited to interactive filters and local UI state. Student eligibility must not be trusted from client input when calculating or confirming a price.

## Issue 3: Place and Pay for an Order

**Labels**: `priority:P1`, `feature:orders`, `feature:payments`, `security`

### User Story

As a verified student, I want to add available meals to a cart, see the exact discounted total, and pay securely so that I can receive the food I selected without duplicate charges or ambiguous order status.

### Acceptance Criteria

- [ ] The server recalculates item prices, student discounts, fees, and totals using exact integer minor-unit money values.
- [ ] Checkout revalidates inventory, menu availability, and student eligibility before creating the payment request.
- [ ] A changed price, discount, fee, or availability is shown before the student confirms payment.
- [ ] FoodWise uses Stripe Checkout or Payment Intents in test mode without storing card details.
- [ ] Stripe webhook signatures are verified before any payment or order mutation.
- [ ] Webhook events are persisted and deduplicated before processing.
- [ ] Duplicate checkout submissions cannot create duplicate orders, charges, or ledger entries.
- [ ] Payment success is based on a verified provider event, never only on the browser return URL.
- [ ] Failed, canceled, expired, disputed, refunded, and partially refunded states are represented clearly.
- [ ] Each payment and order transition is auditable with an actor or provider event, reason, timestamp, and correlation ID.
- [ ] Tests cover money calculations, state transitions, authorization, provider failures, duplicate requests, webhook replay, and the complete checkout flow.
- [ ] The checkout and payment-status UI is keyboard-operable and exposes errors and status changes accessibly.

### Release Gate

Production launch requires a successful reconciliation test, a refund/dispute runbook, secret scanning, redacted-log verification, and review by the responsible security and finance owners.

## Issue 4: Vendor Store and Menu Management

**Labels**: `priority:P1`, `feature:vendor`, `security`

### User Story

As a food vendor, I want to create and manage my store and publish menu versions with student discounts so that students can order accurate, affordable offerings.

### Acceptance Criteria

- [ ] An approved vendor can create a store with required ownership, location, hours, fulfillment, and contact details.
- [ ] A newly created store enters the configured review or moderation state before public publication.
- [ ] A vendor can create and publish a valid versioned menu with item names, prices, availability, discount rules, dietary data, and allergen data.
- [ ] Published menu versions remain immutable for existing order snapshots.
- [ ] Invalid pricing, discounts, availability, or dietary data prevent publication and return field-level accessible errors.
- [ ] The server denies a vendor attempting to read or modify another vendor's store or menu.
- [ ] Unauthorized access attempts are recorded as security events without exposing protected records.
- [ ] Vendor mutations use validated server actions or route handlers and never trust client-supplied ownership or role fields.
- [ ] Tests cover ownership, publication states, menu versioning, validation, discount rules, and keyboard-accessible forms.

### Implementation Notes

Use a resource-based authorization policy in addition to the vendor role. Store ownership and staff assignments must be checked inside the server transaction that performs the mutation.

## Issue 5: Student Meal Support and Loan Applications

**Labels**: `priority:P2`, `feature:support`, `security`, `compliance`

### User Story

As a student facing food insecurity, I want to submit a transparent support or loan application so that I can request help without hidden eligibility decisions or loss of control over my sensitive information.

### Acceptance Criteria

- [ ] A verified student can select a support type and submit an application with required information and explicit consent.
- [ ] The application clearly explains what data is collected, why it is needed, who can access it, and how to request support or correction.
- [ ] The server validates all submitted data and prevents duplicate submissions for the same student and support period unless a retry is safely idempotent.
- [ ] A student can view only their own applications, statuses, requests for information, decisions, and disclosed terms.
- [ ] An authorized reviewer can request more information, approve, decline, or refer an application using a documented reason.
- [ ] Every review action records the actor, role, timestamp, reason, status transition, and correlation ID in an audit history.
- [ ] Approved loan terms show principal, fees, repayment dates, consequences, hardship options, support contacts, and consent requirements before acceptance.
- [ ] The system does not use hidden eligibility rules, automated credit scoring, or coercive repayment messaging.
- [ ] Sensitive application data is excluded from ordinary logs and protected by least-privilege access controls.
- [ ] Tests cover ownership, reviewer authorization, validation, duplicate requests, status transitions, audit events, accessible errors, and data redaction.

### Release Gate

Loan functionality must remain in manual-review or test mode until legal, compliance, consumer-protection, and institutional reviews approve the terms, data retention policy, and support/dispute process.

## Issue 6: Meal-Plan Sponsorships

**Labels**: `priority:P2`, `feature:sponsorships`, `payments`, `privacy`

### User Story

As a student, I want to request a sponsor for a defined meal-plan period, and as a sponsor, I want to fund a commitment without exposing unnecessary student information.

### Acceptance Criteria

- [ ] A verified student can request sponsorship for a defined period and amount with an explicit privacy preference and consent.
- [ ] The student can view the request status, funded amount, remaining need, and available support or cancellation path.
- [ ] A sponsor can view only privacy-preserving campaign information and the amount, purpose, period, and settlement status before committing funds.
- [ ] Student identity and sensitive circumstances are hidden from sponsors unless the student explicitly authorizes disclosure.
- [ ] Sponsorship amounts and currency are calculated using exact money values and cannot become negative or exceed configured limits.
- [ ] Sponsorship payments use the approved provider without storing payment-card data in FoodWise.
- [ ] Provider webhooks are signature-verified, persisted, deduplicated, and reconciled with the sponsorship commitment.
- [ ] Duplicate submissions, retries, failed payments, reversals, and partial refunds do not create duplicate commitments or ledger entries.
- [ ] Students and sponsors receive clear status messages without exposing sensitive information in notifications or logs.
- [ ] Tests cover consent, privacy boundaries, payment states, webhook replay, idempotency, refunds, authorization, and accessible workflows.

### Security Notes

Sponsor-facing views must use explicit data projections rather than returning student records and filtering them in the client. Sponsorship eligibility and visibility rules must be enforced server-side.

## Issue 7: Food Inventory and Waste Tracker

**Labels**: `priority:P2`, `feature:tracker`, `accessibility`

### User Story

As a student, I want to record food I have, see what is nearing expiry, and log consumption or waste so that I can use what I already have and buy more intentionally.

### Acceptance Criteria

- [ ] An authenticated student can add a food item with a name, quantity, unit, storage location, and optional best-before date.
- [ ] Inventory records are private to the student unless an explicitly approved sharing feature is added later.
- [ ] The tracker prioritizes items nearing their best-before date with understandable, non-alarming guidance.
- [ ] A student can log partial or complete consumption and waste events without deleting the original inventory record.
- [ ] Quantity updates reject invalid units, negative values, and corrections that would create an impossible balance.
- [ ] A student can correct an item or event while preserving an auditable history of the original and corrected values.
- [ ] The tracker handles missing dates and uncertain quantities without presenting false precision.
- [ ] Network failures or retried submissions do not create duplicate consumption or waste events.
- [ ] The interface is keyboard-operable, responsive, labeled, and communicates validation and status changes accessibly.
- [ ] Unit, integration, authorization, idempotency, and end-to-end tests cover inventory creation, expiry ordering, corrections, consumption, waste, and privacy.

### Implementation Notes

Use server-side mutations for inventory changes and keep the authoritative quantity in the database. Client-side state may improve responsiveness but must not replace server validation or the audit trail.
