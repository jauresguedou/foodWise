---
title: "[Frontend] Meal detail and store pages: /meals/[menuItemId] and /stores/[storeSlug]"
labels: type:frontend, priority:P1, feature:marketplace, accessibility, scope:mvp
parent: 2
---
## Summary

Detail views that lead into ordering.

## Tasks

- [ ] `/meals/[menuItemId]`: image, description, `PriceTag`, `DietaryTags`, `AllergenList`, store link, placeholder for `AddToCartForm`
- [ ] `/stores/[storeSlug]`: `StoreHeader` (name, campus, address, `StoreHours`, pickup badge), menu grouped by category
- [ ] `/stores` list page with `StoreCard` and campus filter
- [ ] Unavailable items shown with an "Unavailable today" badge and no add-to-cart
- [ ] Call `notFound()` for unknown or unpublished ids and slugs
- [ ] `generateMetadata` for titles and descriptions

## Acceptance criteria

- [ ] Allergens are listed in plain text under a heading, not only as icons
- [ ] Unpublished store slug returns 404
- [ ] Headings follow a logical order (one `h1` per page)
