---
title: "[Frontend] Design tokens, fonts, and shadcn/ui setup"
labels: type:frontend, priority:P1, design, accessibility, scope:mvp
milestone: Week 04
parent: 2
---
## Summary

Put the agreed theme into code so every component uses the same colors, fonts, and spacing. The design direction is in plan.md § Design System and UX Planning. The exact tokens, including the AA-adjusted colors, are in architecture.md §4.

## Tasks

- [ ] Define the palette tokens from architecture.md §4 (`background`, `foreground`, `primary`, `primary-dark`, `deal`, `promo`, `promo-text`, `success`, `warning`, `destructive`, and the rest) in `app/globals.css` using shadcn/ui variable names, exposed through `@theme`
- [ ] Add `--container-page: 75rem` so `max-w-page` gives the 1200px max width
- [ ] Remove the `font-family: Arial` rule on `body` that overrides the theme font
- [ ] Replace Geist in `app/layout.tsx` with `next/font/google` loads of Plus Jakarta Sans (`font-display`), Inter (`font-sans`), and JetBrains Mono (`font-mono`)
- [ ] Run `shadcn init`; set `components.json` aliases to `@/src/components` and `@/src/lib`
- [ ] Add primitives: Button, Input, Label, Badge, Card, Alert, Skeleton, Sheet, Dialog
- [ ] Install `lucide-react`
- [ ] Update `metadata` in `app/layout.tsx` (title template "%s | FoodWise", description)

## Acceptance criteria

- [ ] `bg-primary`, `text-muted-foreground`, `bg-deal`, `font-display`, `max-w-page` work in any component
- [ ] Amber `deal` is used only as a background with `text-foreground` on it
- [ ] Button has visible `focus-visible` styling and a 44px minimum height
- [ ] Every text/background pairing in the palette meets WCAG AA (ratios listed in architecture.md)
