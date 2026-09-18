# Implementation Plan: FoodWise Platform Foundation

**Branch**: `001-foodwise-platform` | **Date**: 2026-09-11 | **Spec**: Initial platform plan
**Input**: Product brief for FoodWise: affordable student meals, vendor stores and menus, ordering and student discounts, payments, loans, sponsorships, and food tracking.

## Summary

Build FoodWise as a single Next.js application using the App Router, strict TypeScript, and Tailwind CSS. The application will use Server Components for data-driven pages and Server Actions or Route Handlers for validated mutations. A PostgreSQL database will be the source of truth for users, vendors, stores, menus, orders, financial records, support applications, and food inventory. Authentication and role-based authorization will be enforced on the server. Stripe will handle payment collection and provider webhooks, while FoodWise will maintain its own auditable order and money ledgers. Loan and sponsorship workflows will begin as controlled internal support workflows and require legal/compliance review before any regulated lending or automated credit decisioning is introduced.

## Technical Context

**Language/Version**: TypeScript 5, strict mode; no `any` or implicit `any`  
**Framework**: Next.js 16 App Router, React 19  
**Styling**: Tailwind CSS v4 utilities; custom CSS only for a documented design-system or browser limitation  
**Primary Dependencies**: PostgreSQL, Prisma ORM, Zod, Auth.js, Stripe SDK, React Testing Library, Vitest, Playwright  
**Storage**: Managed PostgreSQL for transactional data; object storage for explicitly approved files; no payment-card data stored by FoodWise  
**Testing**: ESLint, TypeScript compiler, Vitest unit/integration tests, Playwright end-to-end tests, accessibility assertions, webhook and contract tests  
**Target Platform**: Responsive web application deployed to a managed Node-compatible platform; modern mobile and desktop browsers  
**Project Type**: Single web application with server-rendered UI and server-side application services  
**Performance Goals**: p95 server response under 500 ms for ordinary read operations, fast first contentful render on common mobile networks, and no blocking client JavaScript for read-only pages  
**Constraints**: Financial mutations must be idempotent and auditable; authorization must be server-side; secrets must remain server-only; degraded provider or database states must not corrupt orders or balances  
**Scale/Scope**: Initial release supports students, vendors, sponsors, and internal support/admin roles; design for horizontal web scaling and asynchronous provider events

## Design System and UX Planning

### Design Principles

- Keep the product warm, trust-building, and accessibility-first, rather than clinical or discount-heavy.
- Prioritize mobile-first discovery, because students are most likely to browse and order on a phone.
- Make affordability and eligibility feel clear without exposing sensitive details or creating confusion in the checkout flow.
- Use a calm, reassuring palette that communicates freshness, security, and institutional credibility.

### Color Palette

FoodWise should use a grounded student-marketplace palette that feels practical, affordable, and trustworthy.

- Primary brand: `#1F7A5A` — deep green for the main brand, key CTAs, and student-benefit messaging.
- Primary dark: `#123C32` — used for navigation, headers, and strong text emphasis.
- Accent warmth: `#F6B94A` — amber highlight for price badges, urgency calls, and positive status accents.
- Secondary accent: `#E96F3D` — warm orange for promotional chips, alert highlights, or meal-related emphasis.
- Background shell: `#F6F3EE` — warm off-white for page backgrounds and content surfaces.
- Surface cards: `#FFFFFF` — clean white for product cards, forms, and order summaries.
- Neutral text: `#1F2A27` — dark slate for headings and primary body text.
- Muted text: `#5A6B66` — secondary labels, helper text, and timestamps.
- Border / subtle: `#DCE4E0` — light divider lines and inactive UI states.
- Success: `#2D8A5F` — confirmation states and positive eligibility updates.
- Error: `#C54A4A` — validation errors and failed payment states.
- Warning: `#D9822B` — inventory expiry or caution messaging.

Color usage rules:

- Use green as the default trust/brand color and amber only for pricing, urgency, or status emphasis.
- Do not rely on color alone to convey dietary information, availability, or status; pair it with labels and text.
- Maintain a minimum WCAG-compliant contrast ratio for body text, interactive controls, and focus indicators.

### Typography

Use a modern sans-serif pairing that feels approachable and institutional without feeling too corporate.

- Headings: `Manrope` or `Plus Jakarta Sans` — friendly but structured, suitable for strong product headlines and section titles.
- Body copy: `Inter` — highly legible and comfortable for dense UI such as filters, forms, and food details.
- Monospace: `JetBrains Mono` or `SFMono-Regular` for money values, IDs, and technical status labels.

Recommended type scale:

- Display / hero: 40-48px, 700-800 weight, tight letter spacing on large screens.
- H1: 32-36px, 700 weight.
- H2: 24-28px, 700 weight.
- H3: 20-22px, 600 weight.
- Body: 16px, 400-500 weight, line-height 1.5.
- Small label: 12-14px, 500-600 weight, uppercase or sentence-case depending on context.

Typography rules:

- Keep body text comfortable and readable with 1.5 line-height for forms and product details.
- Use strong emphasis for price and eligibility states, but avoid excessive all-caps across long content.
- Ensure all form labels, validation text, and status text are announced accessibly.

### Layout and Information Architecture

The interface should be optimized for a mobile-first, goal-driven experience with a straightforward progression from discovery to checkout to status.

#### Core Layout Patterns

- Mobile-first single-column stack with sticky bottom navigation or sticky top utility bar for key actions.
- Tablet and desktop layouts use a 12-column grid with fluid content containers and a max width of 1200px.
- Use a generous 8px spacing system: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Cards should have soft shadows, moderate radius, and clear white surfaces on the warm neutral background.

#### Primary Screen Structure

1. Student home / discovery screen
   - sticky top navigation with FoodWise branding and sign-in state
   - search bar and filter chips near the top
   - featured meal categories or deals
   - store cards and item cards in a responsive grid
   - promotional banner for student pricing or support resources

2. Store and menu detail screen
   - hero image or banner
   - store metadata: hours, location, fulfillment options, dietary labeling
   - filterable menu sections
   - item cards with price, discount, availability, and quantity controls

3. Checkout and payment screen
   - summary card with student discount breakdown
   - reassessment of price and availability before confirmation
   - status panel for payment and order state
   - accessible error messaging and retry flows

4. Student dashboard / support screen
   - overview cards for orders, support applications, and tracker status
   - clear grouping of personal data and permissions
   - segmented navigation and status indicators

5. Vendor dashboard
   - left-hand navigation for stores, menus, pricing, and availability
   - review panels for published versions, moderation status, and validation feedback
   - table-like or list-based inventory management with action controls

#### Interaction and Accessibility Standards

- Minimum touch target size: 44x44px.
- Input fields should have labels, helper text, and clear validation messaging.
- Interactive elements must show visible focus rings with contrast-safe colors.
- Use semantic headings, landmarks, and landmarks for forms and navigation.
- No critical information should depend on hover alone; mobile and keyboard users must have equivalent access.

### Design System Deliverables

Use the following as implementation standards for the first UI pass:

- Tailwind theme tokens for colors, spacing, radii, shadows, and type scale.
- Shared card, button, input, badge, and alert component patterns.
- Responsive layouts for mobile, tablet, and desktop breakpoints.
- Accessibility test checklist for keyboard navigation, focus order, and screen-reader labeling.

### Recommended Initial Visual Direction

FoodWise should feel like a modern campus marketplace: practical, encouraging, and safe. The design should communicate affordability without looking discount-driven, and the interface should make student eligibility and checkout confidence feel clear and transparent.

## Constitution Check

*GATE: Must pass before implementation begins and be re-checked at the end of each phase.*

- **Maintainability**: PASS. Feature modules, domain services, schemas, and data access will have explicit boundaries.
- **Strict TypeScript**: PASS. `strict: true` remains enabled; `any`, implicit `any`, and unvalidated external payloads are prohibited.
- **Accessibility**: PASS. Semantic HTML, keyboard workflows, focus handling, labels, status announcements, contrast, and automated accessibility checks are part of definition of done.
- **Security and privacy**: PASS. Server-side authorization, least privilege, validation, secure cookies, audit events, rate limits, and data minimization are required.
- **Testing**: PASS. Financial, authorization, order, inventory, and webhook behavior require unit, integration, contract, and end-to-end coverage as appropriate.
- **Naming and structure**: PASS. Domain vocabulary and the source tree below are part of the implementation contract.
- **Server/client boundaries**: PASS. Sensitive reads and all mutations remain server-owned; Client Components are limited to interactive UI state.
- **Financial responsibility**: PASS with a release gate. Loans, sponsorships, refunds, and payment reconciliation require auditability, idempotency, support paths, and compliance review before production use.
- **Performance and reliability**: PASS. Read caching, pagination, timeouts, retries where safe, observability, and reconciliation jobs are planned.

## Architecture

### Application layers

1. **App Router UI**: Route segments, layouts, loading states, error boundaries, metadata, and accessible forms under `app/`.
2. **Server application services**: Use-case functions that authorize the actor, validate input, enforce domain rules, perform transactions, and emit audit events.
3. **Domain modules**: Feature-owned types, schemas, policies, and state transitions for identity, marketplace, orders, support, and food tracking.
4. **Infrastructure adapters**: Prisma repositories, Auth.js integration, Stripe adapter, email/notification adapter, object storage adapter, rate limiting, and observability.
5. **Database**: PostgreSQL transactions, constraints, indexes, append-only financial/audit records, and migration history.

Reads should use Server Components and server-side query functions. Mutations should use Server Actions for same-application form workflows or Route Handlers for webhooks and externally consumed endpoints. Route Handlers must authenticate or verify the caller and validate every payload. Client Components should be used only for browser interaction such as filter controls, cart state, payment handoff, and live form feedback; they must never contain secrets or authoritative pricing and eligibility logic.

### Proposed source structure

```text
app/
├── (marketing)/
├── (student)/
│   ├── meals/
│   ├── orders/
│   ├── support/
│   └── tracker/
├── (vendor)/vendor/
├── (admin)/admin/
├── api/
│   ├── webhooks/stripe/route.ts
│   └── health/route.ts
├── error.tsx
├── loading.tsx
├── layout.tsx
└── page.tsx

src/
├── auth/
├── db/
│   ├── client.ts
│   └── repositories/
├── domain/
│   ├── identity/
│   ├── marketplace/
│   ├── orders/
│   ├── support/
│   ├── finance/
│   └── tracker/
├── server/
│   ├── actions/
│   ├── policies/
│   └── services/
├── integrations/
│   ├── payments/
│   ├── notifications/
│   └── storage/
├── validation/
├── observability/
└── shared/
    ├── types/
    └── money/

prisma/
├── schema.prisma
└── migrations/

tests/
├── unit/
├── integration/
├── contract/
├── e2e/
└── fixtures/
```

The existing root-level `app/` directory remains the App Router entry point. Shared non-UI code belongs in `src/`; UI components can be added under `src/components/` when they are shared across routes. Feature-specific components should remain close to their route or domain feature.

## Data Model

All IDs should be opaque identifiers. Every mutable aggregate has created and updated timestamps, and important state changes have an actor, reason, and audit event. Monetary amounts use integer minor units plus an explicit currency; floating-point values are not used for money.

- **User**: account identity, email/phone identity references, role assignments, status, consent records, and timestamps. Authentication credentials are managed by the identity provider; FoodWise stores provider identifiers and required profile data.
- **StudentProfile**: verified institution/eligibility attributes, verification status, privacy preferences, and optional dietary preferences. Access is restricted to the student and authorized support staff.
- **Vendor** and **Store**: vendor ownership, store location/service area, operating status, pickup/delivery options, and moderation status.
- **Menu** and **MenuItem**: versioned menu publication, availability, price in minor units, dietary/allergen metadata, inventory limits, and student discount rules. Published menu versions are immutable snapshots for order history.
- **Cart** and **Order**: student, store, line-item snapshots, subtotal, discount, fees, total, currency, fulfillment method, status, and timestamps. Order transitions are constrained by a server-side state machine.
- **Payment** and **Refund**: provider references, order association, amount, currency, status, idempotency key, and reconciliation timestamps. Provider events are stored for deduplication and auditability.
- **FoodSupportApplication**: student request type, amount or meal-plan period, evidence references if required, review status, decision reason, consent, and reviewer audit trail. Loan terms and sponsorship commitments are separate records and never inferred from free text.
- **LoanAccount**, **RepaymentSchedule**, and **LoanTransaction**: approved principal, disclosed terms, balance, schedule, status, and append-only transactions. Production activation requires compliance approval and manual override/support procedures.
- **SponsorCampaign** and **SponsorshipCommitment**: sponsor intent, target period or student eligibility policy, amount, status, consent, and settlement records. Student privacy must be preserved in sponsor-facing views.
- **FoodItem**, **InventoryEntry**, and **ConsumptionLog**: item, quantity/unit, expiry or best-before date, storage location, status, and consumption/waste event. The tracker must support corrections without deleting the audit trail.
- **AuditEvent**: actor, action, entity type/id, request correlation id, outcome, and minimal metadata. Sensitive values are excluded or redacted.
- **IdempotencyKey** and **WebhookEvent**: scoped request/event key, payload hash, processing status, and timestamps for safe retries and duplicate delivery handling.

Database constraints and transactions must enforce ownership, valid status transitions, non-negative balances, unique provider references, and one-time processing of idempotent operations. Personally identifiable and sensitive support data must have a retention and deletion policy before production launch.

## Authentication and Authorization

Use Auth.js with a server-side session strategy and secure, HTTP-only, same-site cookies. The initial provider should be institution-friendly email verification or approved OAuth/SSO, with passwordless or managed credentials preferred over storing passwords in FoodWise. Provider selection must be confirmed against target institutions before implementation.

Authorization is role- and resource-based:

- Students can access only their own profile, orders, support applications, financial records, and tracker data.
- Vendors can manage only stores and menus they own or are assigned to.
- Sponsors can see only their own commitments and aggregate or explicitly consented outcomes.
- Support and admin roles use least privilege, scoped access, stronger authentication, and audited sensitive actions.

Every server action, Route Handler, repository method exposed to a request, and webhook mutation must verify authorization independently. Middleware may redirect unauthenticated users for UX, but it is not the security boundary. Add rate limits and abuse detection to authentication, eligibility, support applications, checkout, and webhook-facing surfaces.

## Payments, Loans, and Sponsorships

Use Stripe Checkout or Payment Intents for student order payments, with Stripe-hosted collection where possible so FoodWise does not handle card data. Use Stripe Connect only if vendor settlement is required and the business/legal model supports it. Verify webhook signatures, persist provider events before processing, make processing idempotent, and reconcile payment state asynchronously. The browser return URL is informational and never proof of payment.

FoodWise must maintain an internal order/payment ledger separate from provider status. A payment may be marked fulfilled only through a verified provider event or an explicitly audited support action. Handle authorization, capture, failure, expiration, refund, dispute, and partial-refund states explicitly. Never silently change totals after checkout; create an adjustment or refund record.

Loan and sponsorship features should initially be implemented as transparent support workflows with manual review and internal accounting records. Do not ship automated credit scoring, hidden eligibility decisions, coercive repayment nudges, or regulated lending without legal, compliance, consumer-protection, and institutional review. Disclose terms, fees, due dates, consequences, sponsor visibility, data use, and support/dispute routes before consent. Provide correction, hardship, cancellation where applicable, and reconciliation procedures.

## Testing Strategy

- **Static checks**: `tsc --noEmit`, ESLint, formatting, dependency and secret scanning, and a rule forbidding explicit `any`.
- **Unit tests**: money arithmetic, discount and eligibility policies, state machines, validation schemas, authorization policies, loan schedule calculations, inventory expiry logic, and idempotency behavior.
- **Integration tests**: Prisma repositories and transactions against an isolated PostgreSQL database; server actions for ownership, permissions, order creation, and support workflows.
- **Contract tests**: Stripe webhook signature and event mapping, payment adapter behavior, notification providers, and any institution verification integration using recorded fixtures or provider test modes.
- **End-to-end tests**: student discovery-to-order flow, vendor menu publication, failed and retried payments, refund path, support application, sponsor commitment, and tracker update. Run with seeded non-production data.
- **Accessibility tests**: keyboard-only journeys, semantic and focus checks, accessible form errors, responsive layouts, and automated axe-style checks on critical routes.
- **Reliability/security tests**: authorization matrix, rate limits, replayed webhooks, duplicate submissions, timeout/provider failure, stale inventory, CSRF protections where applicable, dependency scanning, and redacted logs.

Tests must not use real student, payment, loan, or sponsor data. Financial and authorization tests are release blockers.

## Deployment and Operations

Deploy the Next.js application to Vercel or an equivalent managed platform with separate preview, staging, and production environments. Use managed PostgreSQL with encrypted connections, automated backups, point-in-time recovery, migration gating, and restricted production access. Store secrets in the deployment secret manager; never commit `.env` files or provider credentials.

CI must run type checking, linting, unit/integration tests, build, dependency/security checks, and migration validation on every pull request. Preview deployments use test providers and isolated data. Production migrations must be backward compatible, reviewed, and executed as a controlled release step with a rollback or forward-fix plan.

Use structured, redacted logs with request and operation correlation IDs, error monitoring, uptime checks, database health checks, and alerts for payment webhook failures, reconciliation drift, elevated authorization failures, order errors, and support workflow backlogs. Provide operational runbooks for provider outage, duplicate payment, refund, compromised account, data incident, failed migration, and loan-ledger reconciliation.

## Delivery Phases

1. **Foundation**: repository structure, strict lint/type rules, Tailwind baseline, environment validation, PostgreSQL/Prisma setup, Auth.js integration, CI, logging, and shared error/result conventions.
2. **Marketplace**: vendor/store onboarding, menu publication and versioning, student discovery/search, discount policy, and accessibility-tested read paths.
3. **Ordering and payments**: cart and order state machine, exact pricing, Stripe test-mode checkout, verified webhooks, ledger/reconciliation, refunds, and end-to-end coverage.
4. **Student support**: support applications, sponsor campaigns and commitments, privacy controls, manual review tooling, auditable decisions, and compliance gate.
5. **Food tracker**: inventory entries, expiry views, consumption and waste logging, corrections, and privacy-preserving analytics.
6. **Hardening and launch**: threat model review, accessibility review, load and failure testing, backup restore test, operational runbooks, production readiness review, and staged rollout.

## Definition of Done

A feature is complete only when its server/client boundary is explicit, inputs and external responses are schema-validated, authorization and audit behavior are tested, accessible UI states are implemented, documentation is updated, CI passes, and operational failure behavior is understood. Financial, support, privacy, or security-sensitive features additionally require a recorded review from the responsible technical and product/compliance owners.

## Complexity Tracking

No constitution violations are planned. Prisma repositories, domain services, an internal ledger, and separate payment adapters are intentional boundaries required by the security, auditability, and financial reliability requirements; direct client-to-database access and provider-only payment state were rejected because they would weaken authorization and reconciliation.
