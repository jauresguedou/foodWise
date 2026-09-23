---
title: "[Frontend] Root layout: SiteHeader, SiteFooter, and home page shell"
labels: type:frontend, priority:P1, accessibility, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

Build the shell every page sits in, and replace the Create Next App starter home page.

## Tasks

- [ ] `Container`, `SiteHeader`, `SiteFooter`, `MainNav`, `MobileNav` (Sheet below `md`) in `src/components/layout/`
- [ ] Header slots for `CartButton` and `UserMenu` (placeholders until auth and cart exist)
- [ ] Skip-to-content link as the first focusable element
- [ ] Home page `/`: hero with search box linking to `/meals?q=`, "Today's student deals" section (static placeholder until queries land)
- [ ] `app/not-found.tsx` and `app/error.tsx` using the theme

## Acceptance criteria

- [ ] Header is sticky, 64px high, and usable by keyboard at 320px and 1280px widths
- [ ] Landmarks: one `header`, one `nav` with `aria-label`, one `main`, one `footer`
- [ ] No horizontal scroll at 320px
- [ ] Lighthouse accessibility score ≥ 95 on `/`
