---
title: "[DevOps] CI workflow and test tooling (typecheck, lint, Vitest, Playwright)"
labels: type:devops, priority:P1, scope:mvp
milestone: Week 04
---
## Summary

Every pull request runs the same checks so `main` stays green.

## Tasks

- [ ] Add `typecheck` (`tsc --noEmit`), `format:check` (Prettier), `test` (Vitest), and `test:e2e` (Playwright) npm scripts
- [ ] Vitest config with one sample unit test (e.g. a trivial `sum` test until the money module lands)
- [ ] Playwright config with one smoke test that loads `/`
- [ ] ESLint rule `@typescript-eslint/no-explicit-any: error`
- [ ] `.github/workflows/ci.yml` on pull requests: install, typecheck, lint, format check, unit tests, build
- [ ] Add `@axe-core/playwright` for accessibility checks in e2e tests
- [ ] Protect `main`: require CI to pass and one review

## Acceptance criteria

- [ ] A PR with a type error fails CI
- [ ] CI finishes in under 5 minutes on a clean run
