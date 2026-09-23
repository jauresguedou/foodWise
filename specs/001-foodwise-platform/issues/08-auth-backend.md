---
title: "[Backend] Authentication, roles, and student eligibility check"
labels: type:backend, priority:P1, feature:identity, security, scope:mvp
parent: 1
---
## Summary

Email and password sign-in with roles, and school-domain student eligibility. First confirm Auth.js v5 is still the right library (see the spec's Open questions).

## Tasks

- [ ] Configure Auth.js Credentials provider in `src/auth/`; bcrypt password hashing
- [ ] `register` Server Action: Zod-validate, lowercase email, reject duplicates with a generic message, set `studentVerifiedAt` when the domain is in `STUDENT_EMAIL_DOMAINS`
- [ ] `register` stores the chosen `countryCode` (ISO 3166-1 alpha-2, default `US`)
- [ ] Session includes `userId`, `role`, `isVerifiedStudent`, `countryCode`; nothing else
- [ ] Helpers: `getSession()`, `requireUser()`, `requireVerifiedStudent()`, `requireVendor()` that throw or redirect
- [ ] `proxy.ts` redirects signed-out users away from `/cart`, `/checkout`, `/orders`, `/account`, `/vendor` (UX only)
- [ ] Rate limit: 5 failed sign-ins per email per 15 minutes

## Acceptance criteria

- [ ] Cookies are HTTP-only, `SameSite=Lax`, `Secure` in production
- [ ] A student cannot reach vendor actions even by calling the Server Action directly (test)
- [ ] Wrong password and unknown email return the same error message
- [ ] `passwordHash` never reaches a Client Component (test or review check)
