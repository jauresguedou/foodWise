import { describe, expect, it } from "vitest";

import { getMeals } from "../../src/server/queries/meals";
import { getStoreBySlug, getStores, normalizeStoreSlug } from "../../src/server/queries/stores";

// This test covers the public store list and deep store lookup rules.
describe("store query read rules", () => {
  it("returns only published stores in the store list", () => {
    const result = getStores({ page: 1 });

    expect(result.stores.every((store) => store.name !== "")) .toBe(true);
    expect(result.stores.some((store) => store.name === "Juniper & Grain")).toBe(true);
  });

  it("returns a public store with its menu without archived items", () => {
    const store = getStoreBySlug("juniper-grain");

    expect(store?.name).toBe("Juniper & Grain");
    expect(store?.menu.every((item) => item.archivedAt === null)).toBe(true);
  });

  it("keeps unavailable items visible on the store page while hiding them from the default discovery list", () => {
    const store = getStoreBySlug("juniper-grain");
    const meals = getMeals({ page: 1 }, undefined, false);

    expect(store?.menu.some((item) => item.id === "m2" && item.isAvailable === false)).toBe(true);
    expect(meals.items.some((item) => item.id === "m2")).toBe(false);
  });

  it("normalizes the route slug before store lookup", () => {
    expect(normalizeStoreSlug("  Juniper-Grain  ")).toBe("juniper-grain");
    expect(normalizeStoreSlug("   ")).toBe("");
  });
});
