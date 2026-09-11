# FoodWise Constitution

## Purpose

FoodWise exists to help students access affordable meals, order food at student prices, manage food support, and reduce waste. This constitution defines the non-negotiable engineering and product principles that govern its development. It is intentionally high-level; implementation plans must comply with these principles without treating them as optional guidance.

## Principles

### I. Maintainable, Deliberate Code

Code MUST be clear, cohesive, and maintainable. Each change MUST have a focused purpose, use existing project patterns where appropriate, and avoid unnecessary abstraction or duplication. Public behavior, data contracts, and meaningful trade-offs MUST be documented near the relevant code or in project documentation. Temporary workarounds MUST have an owner and a removal condition.

### II. Strict TypeScript and Type Safety

All application code MUST use TypeScript's strict type checking. The `any` type is forbidden, including implicit `any`; unknown external data MUST be validated or narrowed before use. Types MUST represent domain invariants such as student eligibility, prices, order states, loan states, and payment states. Unsafe assertions, non-null assertions, and type suppression MUST be rare, justified, and reviewable.

### III. Accessible and Inclusive by Default

Every user-facing workflow MUST be usable by people with different abilities, devices, languages, literacy levels, and financial circumstances. Interfaces MUST provide semantic structure, keyboard access, visible focus, sufficient contrast, meaningful labels, understandable validation, and accessible status and error feedback. Accessibility MUST be considered for discovery, ordering, payment, loan and sponsorship requests, vendor management, and food tracking, not added after implementation.

### IV. Privacy, Security, and Least Privilege

Student identity, eligibility information, dietary information, orders, addresses, payment details, loan applications, sponsorship activity, and vendor data MUST be treated as sensitive. The system MUST collect only what is necessary, restrict access by role and purpose, protect data in transit and at rest where applicable, avoid exposing secrets or sensitive data in logs, and provide secure session and account handling. Authorization MUST be enforced server-side for every protected operation; client-side checks are never sufficient.

### V. Evidence Through Testing

Changes MUST be tested at the level of risk they introduce. Critical paths, including authentication, authorization, pricing and discounts, order state transitions, payment records, loan decisions and balances, sponsorship commitments, and food inventory changes MUST have automated coverage. Tests MUST include validation failures, permission boundaries, duplicate or retried requests, unavailable inventory, and provider failures where relevant. A change MUST NOT be considered complete when its affected behavior cannot be verified reproducibly.

### VI. Precise Naming and Domain Language

Names MUST communicate intent and use consistent domain terminology. Variables, functions, components, types, routes, events, and database fields MUST use descriptive names rather than unexplained abbreviations. Related concepts MUST use the same terms across UI copy, code, APIs, tests, and documentation; for example, student, vendor, store, menu item, order, sponsor, loan, meal plan, and food item MUST not be used interchangeably without a defined distinction.

### VII. Predictable Project Structure

The project MUST maintain a discoverable structure in which files are grouped by responsibility and feature boundaries are evident. Server concerns, client concerns, shared domain types, validation, data access, tests, and documentation MUST have clear ownership. New files MUST follow the established structure and naming patterns. A structural change MUST update imports, tests, documentation, and configuration as needed rather than leaving parallel or ambiguous paths.

### VIII. Explicit Server and Client Boundaries

The server MUST own authentication, authorization, sensitive data access, pricing decisions, discount eligibility, inventory truth, order and loan state transitions, payment and sponsorship records, and integrations with trusted services. The client MAY own presentation, local interaction state, and optimistic experiences only when they cannot bypass server truth. Sensitive operations and secrets MUST never depend on client-side enforcement or be embedded in client bundles.

### IX. Responsible Financial and Student Support Workflows

Financial features MUST prioritize correctness, transparency, consent, and harm reduction. Prices, discounts, fees, totals, repayment terms, eligibility criteria, sponsor commitments, and status changes MUST be shown clearly before confirmation and recorded with an auditable history. Money MUST be represented with exact, appropriate value semantics rather than lossy floating-point calculations. Payment and loan operations MUST be idempotent, recoverable, and reconciled with their provider or ledger state. The product MUST avoid coercive lending or sponsorship experiences, must not make unsupported promises, and MUST provide clear failure, dispute, and support paths.

### X. Collaboration, Review, and Documentation

Work MUST be delivered in small, focused Git changes with meaningful commit messages and branches or pull requests that identify the problem, scope, testing, and known risks. Changes MUST receive review before merging, with particular scrutiny for security, accessibility, data migrations, and financial behavior. Review feedback MUST be resolved or explicitly recorded. Documentation MUST be updated when behavior, setup, contracts, user-facing policies, or operational responsibilities change.

### XI. Performance, Reliability, and Recovery

FoodWise MUST remain responsive and dependable on common student devices and networks. Performance budgets and user-perceived responsiveness MUST be considered for search, menus, checkout, dashboards, and tracking flows. The system MUST handle expected retries, timeouts, partial failures, stale data, and unavailable vendors without corrupting state or silently losing user actions. Critical operations MUST be observable, produce actionable errors, and support safe recovery or reconciliation.

## Development Workflow

Every feature or fix MUST identify the affected principles, define acceptance behavior, and include an appropriate validation strategy before merge. Automated checks MUST pass before integration, and exceptions to this constitution MUST be documented with scope, rationale, risk, owner, and expiration or review date. Exceptions are temporary and MUST NOT become an undocumented alternative standard.

## Governance

This constitution is the highest-level development standard for FoodWise. When a local convention or implementation choice conflicts with it, the constitution prevails unless an approved exception is recorded. Proposed amendments MUST explain the motivation, impact on existing work, migration needs, and updated validation expectations. The team MUST review this document when financial, privacy, accessibility, or architectural scope changes materially.

**Version**: 1.0.0  
**Ratified**: 2026-09-11  
**Last Amended**: 2026-09-11
