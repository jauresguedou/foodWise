---
title: "[Backend] Multi-currency money module and country defaults"
labels: type:backend, priority:P1, feature:marketplace, feature:payments, scope:mvp
milestone: Week 04
parent: 3
---
## Summary

Each store sells in one currency, set from its country. Every price, order, and payment uses the store's currency, with no conversion. A user's country sets their default campus and how prices are formatted. See the spec's currency clarification and architecture.md §3.

## Tasks

- [ ] `src/lib/money.ts`:
  - `formatMoney(amountMinor, currency, locale)` using `Intl.NumberFormat`
  - `toMinor(input, currency)` parses a vendor's typed price using the currency's decimal places
  - `currencyDecimals(currency)` read from `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits`
  - `sumMinor(amounts)` that throws if currencies differ
- [ ] `src/lib/countries.ts`: supported countries with their default currency and locale (start with `US`/`USD`/`en-US`; add others as the team needs them)
- [ ] Zod helpers `currencyCodeSchema` (3 uppercase letters, in the supported list) and `countryCodeSchema`
- [ ] Document the "no conversion, one currency per store" rule in `src/lib/money.ts`

## Acceptance criteria

- [ ] Unit tests: `formatMoney(1299, 'USD', 'en-US')` is `$12.99`; `formatMoney(1299, 'JPY', 'ja-JP')` is `￥1,299`
- [ ] Unit tests: `toMinor('12.99', 'USD')` is `1299`; `toMinor('12.999', 'USD')` and `toMinor('12.5', 'JPY')` are rejected
- [ ] Unit test: `sumMinor` with mixed currencies throws
- [ ] No money math anywhere uses floats or assumes 100 minor units per major unit
