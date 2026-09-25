# FoodWise Feature Specification

**Feature Branch**: `001-foodwise-platform`  
**Created**: 2026-09-11  
**Revised**: 2026-09-23 (MVP scope and clarifications)  
**Status**: Draft  
**Input**: FoodWise platform plan for affordable student meals, ordering, student discounts, payments, food support, sponsorships, and food tracking.

## MVP Scope

The full vision below is larger than one semester for a three-person team. The MVP targets the core loop: a vendor lists meals, a student finds one, and the student orders it for pickup.

| Story | Priority | MVP status | Notes |
| --- | --- | --- | --- |
| US1 Student account and eligibility | P1 | **In MVP** (simplified) | Email/password sign-in; eligibility by school email domain. |
| US2 Discover affordable meals | P1 | **In MVP** | First feature built. |
| US3 Place and pay for an order | P1 | **In MVP** (simplified) | Pickup orders with pay-at-pickup. Stripe test mode is a stretch goal. |
| US4 Vendor manages a store and menu | P1 | **In MVP** (simplified) | Menu items edited in place; orders keep price snapshots instead of menu versions. |
| US7 Track food and reduce waste | P2 | Stretch | Independent of ordering; build only if the MVP ships early. |
| US6 Meal-plan sponsorships | P2 | Post-MVP | Depends on real payments and privacy review. |
| US5 Meal support and food loans | P2 | Post-MVP | Loans are regulated lending. No code until legal and institutional review. |
| US8 Operational integrity and support | P3 | Post-MVP | Admins use seed data and database tools during the MVP. |

The MVP's routes, components, data model, and design system are in [architecture.md](./architecture.md).

## Clarifications

### Session 2026-09-23

These answers resolve gaps in the original draft. They apply to the MVP; later phases may revisit them.

- **Q: How is student eligibility verified?** → A: At registration, the email domain must be on a configured allowlist of school domains (for example `byu.edu`). An account on an allowlisted domain gets `studentVerifiedAt` set. Emailed confirmation codes are a follow-up. (FR-002)
- **Q: Can people browse without an account?** → A: Yes. Stores and meals are public, and student prices are shown with a "verified students" label. Adding to cart and ordering require a verified student account. (FR-004)
- **Q: What does "nearby" mean?** → A: Each store has a campus and address. Discovery filters by campus. There is no geolocation or distance sort in the MVP.
- **Q: Who delivers?** → A: Nobody in the MVP. All orders are pickup. Stores keep a `deliveryAvailable` flag for later.
- **Q: What fees and taxes apply?** → A: No platform fees. Menu prices are tax-inclusive. Order total = sum of (unit price × quantity), where unit price is the student price when one exists and the buyer is verified. (FR-005)
- **Q: What form do student discounts take?** → A: A fixed `studentPriceMinor` per menu item, which must be lower than `priceMinor`. Percentage rules and time windows are out of scope.
- **Q: How is payment collected?** → A: MVP orders are pay-at-pickup, so the order is placed with payment status `UNPAID`. The vendor marks it `PAID` at pickup. Stripe Checkout in test mode is the stretch goal for US3 and replaces this when it ships. (FR-006, FR-007)
- **Q: Can a cart hold items from several stores?** → A: No. Each order belongs to one store. Adding an item from a second store asks the student to clear the cart first.
- **Q: What is the order lifecycle?** → A: `PLACED → PREPARING → READY → COMPLETED`, with `CANCELLED` possible before `READY`. Payment status is tracked on its own field: `UNPAID`, `PAID`, `REFUNDED`.
- **Q: How are menu versions handled?** → A: Menu items are edited in place. Each order line stores a snapshot of the item name and prices, so past orders never change. Items that have been ordered are archived instead of deleted.
- **Q: Who approves vendors and stores?** → A: New stores start as `PENDING_REVIEW`. For the MVP, an admin publishes them through seed data or a database update. No admin UI yet.
- **Q: Can one account be both a student and a vendor?** → A: No. Each account has exactly one role: `STUDENT`, `VENDOR`, or `ADMIN`.
- **Q: What currency?** → A: Multi-currency, based on country. Each store has one currency (an ISO 4217 code such as `USD`, `CAD`, or `GHS`), set from the store's country. Its menu prices, orders, and payments all use that currency. There is no conversion at checkout: a student pays in the store's currency. Each user picks a country at registration. It sets their default campus filter and how numbers and prices are formatted. Money is stored as an integer count of the currency's minor unit (cents for USD, none for JPY). The US is the default country, with USD.
- **Q: How do price filters work across currencies?** → A: The max-price filter applies only once a campus is selected, so all results share one currency.
- **Q: What are the rate-limit thresholds?** → A: Sign-in: 5 failed attempts per email per 15 minutes. Other thresholds are set during hardening.
- **Q: How are success criteria SC-001 and SC-006 measured?** → A: SC-001 is measured by the seeded end-to-end test suite. SC-006 is measured with at least five classmates in an informal usability session.

### Open questions

- Data retention periods for accounts and orders (FR-013) are undecided. Needed before any real student data is stored.
- Auth.js is now maintained under the Better Auth project. The team should confirm Auth.js v5 is still the right choice before starting the auth issue.
- Should prices also show an approximate conversion into the viewer's own currency (for example, an international student browsing a US campus)? That needs an exchange-rate source. Post-MVP unless the team decides otherwise.

## User Stories & Testing

### User Story 1 - Student account and eligibility (Priority: P1)

As a student, I want to create a secure account and verify my student eligibility so that I can access student prices and protected support features.

**Why this priority**: Identity and eligibility are prerequisites for safe access to discounts, orders, loans, sponsorships, and personal data.

**Independent Test**: A test student can register or sign in, complete eligibility verification, and access a protected student dashboard while an unverified or unauthorized account is denied restricted features.

**Acceptance Scenarios**:

1. **Given** a new student with a valid supported identity, **when** the student completes account registration and required consent, **then** FoodWise creates the account with a secure session and clearly states what data is collected.
2. **Given** a signed-in student with unverified eligibility, **when** the student attempts to use a student-only discount or support workflow, **then** FoodWise blocks the action and explains how to complete verification.
3. **Given** a verified student, **when** the student requests their profile or support records, **then** the server returns only records belonging to that student.
4. **Given** repeated failed authentication or verification attempts, **when** the configured threshold is reached, **then** FoodWise rate-limits the attempts and records a security event without exposing sensitive details.

### User Story 2 - Discover affordable meals (Priority: P1)

As a student, I want to browse nearby stores and menus with student prices, availability, dietary information, and pickup or delivery options so that I can find an affordable meal quickly.

**Why this priority**: Meal discovery is the primary user value and must work before ordering can begin.

**Independent Test**: Seeded stores and menus can be searched and filtered by a student, with correct availability and discount presentation on mobile and desktop.

**Acceptance Scenarios**:

1. **Given** published stores and menus, **when** a student opens the meal discovery page, **then** the page shows available stores, current menu items, base prices, eligible student prices, and fulfillment options.
2. **Given** a menu item that is unavailable or outside its publication window, **when** a student browses the store, **then** the item is clearly unavailable and cannot be added to a new order.
3. **Given** dietary or allergen information attached to a menu item, **when** the student views the item, **then** the information is presented with accessible text and is not represented by color alone.
4. **Given** a student using keyboard navigation or a narrow viewport, **when** the student searches and filters menus, **then** all controls remain operable, labeled, and readable without horizontal scrolling.

### User Story 3 - Place and pay for an order (Priority: P1)

As a verified student, I want to add available meals to a cart, see the exact discounted total, and pay securely so that I can receive the food I selected without duplicate charges or ambiguous order status.

**Why this priority**: Ordering and payment deliver the core transaction while carrying the highest integrity and financial risk.

**Independent Test**: In payment-provider test mode, a verified student can complete one order, receive a confirmed order state from a verified webhook, and safely retry the checkout request without creating a duplicate order or charge.

**Acceptance Scenarios**:

1. **Given** an authenticated verified student and an available menu item, **when** the student adds it to the cart, **then** the server recalculates the price, discount, fees, and total using exact money values.
2. **Given** a cart with a changed price, discount eligibility, or inventory state, **when** the student begins checkout, **then** FoodWise shows the updated total and requires confirmation before payment.
3. **Given** a valid payment request, **when** the payment provider confirms payment through a verified webhook, **then** FoodWise records the provider event, marks the payment and order consistently, and shows the student the order status.
4. **Given** a duplicate checkout submission or replayed webhook, **when** FoodWise processes it, **then** idempotency prevents duplicate charges, duplicate orders, or duplicate ledger entries.
5. **Given** a payment failure, timeout, cancellation, or refund, **when** the provider reports the outcome, **then** FoodWise shows an actionable status and preserves an auditable payment history.

### User Story 4 - Vendor manages a store and menu (Priority: P1)

As a food vendor, I want to create and manage my store and publish menu versions with student discounts so that students can order accurate, affordable offerings.

**Why this priority**: Reliable vendor data is necessary for trustworthy discovery, pricing, inventory, and order fulfillment.

**Independent Test**: An authorized vendor can create a store, publish a menu, update future availability, and observe that another vendor cannot access or modify it.

**Acceptance Scenarios**:

1. **Given** an approved vendor account, **when** the vendor creates a store with required details, **then** the store is saved in a reviewable state and is associated only with that vendor.
2. **Given** a vendor-owned store, **when** the vendor publishes a valid menu version with prices, availability, and discount rules, **then** students see the published version and prior orders retain their original item snapshots.
3. **Given** a vendor attempts to edit another vendor's store or menu, **when** the request reaches the server, **then** authorization denies it and creates an auditable security event.
4. **Given** invalid pricing, discount, availability, or allergen data, **when** the vendor submits the menu, **then** validation identifies the fields to correct and does not publish the invalid version.

### User Story 5 - Apply for meal support or a food loan (Priority: P2)

As a student facing food insecurity, I want to submit a transparent support or loan application so that I can request help without hidden eligibility decisions or loss of control over my sensitive information.

**Why this priority**: Support directly addresses FoodWise's mission, but it depends on secure identity and requires compliance and operational review.

**Independent Test**: A test student can submit an application, view its status, and receive a clear decision or request for information; an unauthorized user cannot view it.

**Acceptance Scenarios**:

1. **Given** a verified student, **when** the student submits a support or loan application with consent, **then** FoodWise validates required information, stores the application securely, and shows the next step and expected review status.
2. **Given** a submitted application, **when** an authorized reviewer requests more information or records a decision, **then** FoodWise records the actor, reason, timestamp, and disclosed terms in an audit history.
3. **Given** a student reviewing an approved loan, **when** the student views the offer, **then** principal, fees, repayment dates, consequences, support options, and consent requirements are shown before acceptance.
4. **Given** a user without ownership or support authorization, **when** they request an application, **then** FoodWise denies access without revealing whether another student's application exists.

### User Story 6 - Request or fund a meal-plan sponsorship (Priority: P2)

As a student, I want to request a sponsor for a defined meal-plan period, and as a sponsor, I want to fund a commitment without exposing unnecessary student information.

**Why this priority**: Sponsorship expands access to meals but must protect dignity, consent, privacy, and financial accountability.

**Independent Test**: A student can request support for a defined period, a sponsor can make a test-mode commitment, and both parties see only their permitted status and records.

**Acceptance Scenarios**:

1. **Given** a verified student who consents to sponsorship terms, **when** the student requests a meal-plan sponsor, **then** FoodWise records the target period, amount, privacy preference, and request status.
2. **Given** an eligible sponsorship opportunity, **when** a sponsor commits funds, **then** the sponsor sees the amount, purpose, settlement status, and cancellation or support path before confirmation.
3. **Given** a sponsor view, **when** the sponsor checks a commitment, **then** FoodWise does not expose the student's identity or sensitive circumstances unless explicitly authorized.
4. **Given** a failed, reversed, or duplicated sponsorship payment, **when** the provider reports the event, **then** FoodWise reconciles the commitment idempotently and shows a clear status to the affected parties.

### User Story 7 - Track food and reduce waste (Priority: P2)

As a student, I want to record food I have, see what is nearing expiry, and log consumption or waste so that I can use what I already have and buy more intentionally.

**Why this priority**: The tracker supports FoodWise's waste-reduction mission and provides value independent of ordering.

**Independent Test**: A student can add food, view expiry-focused suggestions, mark food as consumed or wasted, and correct an entry without losing the history.

**Acceptance Scenarios**:

1. **Given** an authenticated student, **when** the student adds a food item with quantity and date information, **then** it appears in their private inventory with a clear status.
2. **Given** inventory items approaching their best-before date, **when** the student opens the tracker, **then** the items are prioritized with understandable, non-alarming guidance.
3. **Given** an inventory item, **when** the student logs consumption or waste, **then** the remaining quantity and event history update without deleting the original record.
4. **Given** an incorrect inventory entry, **when** the student corrects it, **then** the correction is applied only to their inventory and the audit history remains available for consistency checks.

### User Story 8 - Manage operational integrity and support (Priority: P3)

As a support or admin operator, I want to review audited exceptions, reconcile financial events, and resolve account or order issues so that FoodWise can recover safely from failures.

**Why this priority**: Operations are essential for trust and reliability, but the workflows are needed after the primary student, vendor, and payment paths exist.

**Independent Test**: A least-privileged operator can investigate a seeded payment or order exception, take an authorized corrective action, and produce an auditable record without accessing unrelated student data.

**Acceptance Scenarios**:

1. **Given** a failed webhook, reconciliation mismatch, or disputed order, **when** an authorized operator opens the exception, **then** the system shows relevant redacted evidence and a safe next action.
2. **Given** an operator without the required permission, **when** they attempt a sensitive correction, **then** FoodWise denies the action and logs the attempt.
3. **Given** a corrective action such as a refund or order adjustment, **when** the operator confirms it, **then** FoodWise requires a reason and writes an immutable audit event.

## Edge Cases

- A menu item becomes unavailable between cart creation and checkout.
- Student eligibility expires or changes while a cart is open.
- A payment provider sends duplicate, delayed, out-of-order, or invalidly signed webhooks.
- A student retries a request after a timeout and the first request actually succeeded.
- A vendor changes a menu after an order is placed.
- A loan or sponsorship review requires additional information or is withdrawn.
- A sponsor payment is reversed or partially refunded.
- A food item has no known expiry date or a quantity correction would become negative.
- A user loses network connectivity during a mutation.
- A user requests data they are not authorized to view.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST authenticate users with secure server-managed sessions and support role-based authorization.
- **FR-002**: The system MUST verify student eligibility before granting student-only prices or support workflows.
- **FR-003**: The system MUST allow approved vendors to manage stores, versioned menus, availability, and student discounts.
- **FR-004**: The system MUST allow eligible students to browse, filter, and view affordable meals with accessible dietary and fulfillment information.
- **FR-005**: The system MUST calculate order prices, discounts, fees, and totals server-side using exact money semantics.
- **FR-006**: The system MUST process order payments through a compliant payment provider without storing card details.
- **FR-007**: The system MUST verify, persist, deduplicate, and reconcile payment provider webhooks.
- **FR-008**: The system MUST maintain auditable order, payment, refund, support, loan, and sponsorship histories.
- **FR-009**: The system MUST provide transparent support and loan application workflows with disclosed terms and manual/compliance review gates.
- **FR-010**: The system MUST support privacy-preserving sponsorship requests, commitments, settlement, and failure handling.
- **FR-011**: The system MUST let students track food inventory, expiry information, consumption, and waste corrections.
- **FR-012**: The system MUST provide accessible, responsive, keyboard-operable workflows and understandable errors.
- **FR-013**: The system MUST protect sensitive data through least privilege, rate limiting, redacted logs, secure secrets, and data retention controls.
- **FR-014**: The system MUST provide operational observability, reconciliation, backups, and safe recovery for critical failures.

### Key Entities

- **User and StudentProfile**: Account identity, roles, eligibility, consent, and private student data.
- **Vendor, Store, Menu, and MenuItem**: Vendor-owned marketplace offerings and published pricing.
- **Cart, Order, Payment, and Refund**: Order lifecycle and auditable financial state.
- **FoodSupportApplication, LoanAccount, and RepaymentSchedule**: Student support requests and disclosed financial assistance terms.
- **SponsorCampaign and SponsorshipCommitment**: Privacy-preserving meal-plan funding relationships.
- **FoodItem, InventoryEntry, and ConsumptionLog**: Personal food tracking and waste events.
- **AuditEvent, IdempotencyKey, and WebhookEvent**: Security, reliability, and financial integrity records.

**MVP entities**: the MVP implements five of these: **User** (a vendor is a User with the `VENDOR` role), **Store**, **MenuItem**, **Order**, and **OrderItem**. Cart contents live in an HTTP-only cookie and are re-priced on the server. The order's idempotency key is a unique column on Order. The remaining entities arrive with their post-MVP stories. Field-level definitions are in [architecture.md](./architecture.md#3-data-model).

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 95% of seeded verified students can complete meal discovery and checkout in an end-to-end test without operator intervention.
- **SC-002**: 100% of authorization, payment, webhook, refund, loan, sponsorship, and inventory mutation tests pass before release.
- **SC-003**: Duplicate checkout submissions and replayed payment webhooks create zero duplicate charges, orders, or ledger entries in reliability tests.
- **SC-004**: All critical student and vendor workflows pass keyboard and automated accessibility checks before release.
- **SC-005**: No production database record contains full payment-card data, and sensitive logs contain zero unredacted student financial fields in audit tests.
- **SC-006**: At least 90% of test users can identify the final order total, discount, and payment status without assistance.
- **SC-007**: Food tracker test users can add, consume, correct, and review an inventory item in under two minutes.
