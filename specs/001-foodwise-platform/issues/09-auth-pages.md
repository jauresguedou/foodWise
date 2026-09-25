---
title: "[Frontend] /login, /register, and /account pages"
labels: type:frontend, priority:P1, feature:identity, accessibility, scope:mvp
parent: 1
---
## Summary

Accessible sign-in and registration forms, and a page that shows eligibility status.

## Tasks

- [ ] `LoginForm` and `RegisterForm` (client) using `useActionState` with the auth Server Actions
- [ ] Register form explains what data is collected and why, with a consent checkbox
- [ ] `/account`: name, email, role, eligibility status; `VerificationNotice` explains how to become verified
- [ ] `UserMenu` in the header: sign in link when signed out; account, orders, sign out when signed in
- [ ] Redirect back to the original page after sign-in (`callbackUrl`)

## Acceptance criteria

- [ ] Every field has a visible label; errors are linked with `aria-describedby` and announced
- [ ] Focus moves to the first error on a failed submit
- [ ] Password field supports password managers (`autocomplete` attributes)
