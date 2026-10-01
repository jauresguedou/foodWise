import { describe, expect, it } from "vitest";

import { getMealById, getMeals, normalizeMenuItemId } from "../../src/server/queries/meals";

// This file exercises the same read logic the discovery pages use.
// It proves that unpublished stores never leak into public results.
describe("meal query read rules", () => {
  it("hides items from stores that are still pending review", () => {
    const result = getMeals({ page: 1 }, undefined, false);

    // The PENDING_REVIEW store in the demo data should never appear on the public meal list.
    expect(result.items.some((item) => item.store.name === "Lantern Kitchen")).toBe(false);
    expect(result.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("applies maxPriceMinor only when a campus filter is active", () => {
    const withCampus = getMeals({ campus: "North Campus", maxPriceMinor: 900 }, undefined, false);
    const withoutCampus = getMeals({ maxPriceMinor: 900 }, undefined, false);

    // The max price cap is only meaningful when the query is scoped to a single campus and currency.
    expect(withCampus.items.every((item) => item.displayPriceMinor <= 900)).toBe(true);
    expect(withoutCampus.items.length).toBeGreaterThan(0);
  });

  it("paginates results and keeps a full total count", () => {
    const result = getMeals({ page: 1 }, undefined, false);

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(24);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.items.length);
    expect(result.items.length).toBeLessThanOrEqual(24);
  });

  it("projects only public data and includes the store currency", () => {
    const result = getMeals({ page: 1 }, undefined, false);
    const firstItem = result.items[0];

    expect(firstItem).toBeDefined();
    expect(firstItem.currency).toBe("USD");
    expect(firstItem).not.toHaveProperty("passwordHash");
    expect(firstItem).not.toHaveProperty("ownerEmail");
    expect(firstItem.store).not.toHaveProperty("passwordHash");
  });

  it("returns a specific meal only when the store is public and not archived", () => {
    const publishedMeal = getMealById("m1");
    const hiddenMeal = getMealById("m5");

    expect(publishedMeal?.name).toBe("Harvest grain bowl");
    expect(hiddenMeal).toBeNull();
  });

  it("normalizes a route menu item id before lookup", () => {
    expect(normalizeMenuItemId("  m-1  ")).toBe("m-1");
    expect(normalizeMenuItemId("   ")).toBe("");
  });
});
