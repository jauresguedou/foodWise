import { describe, expect, it } from "vitest";

import { effectivePriceMinor, formatMoney } from "../../src/lib/money";
import { mealFiltersSchema, resolveDefaultCampus } from "../../src/validation/meal-filters";

// This test proves that malformed search parameters do not crash the page.
// Instead, the schema turns broken input into safe default values.
describe("mealFiltersSchema", () => {
  it("falls back to default values when bad input is passed", () => {
    const parsed = mealFiltersSchema.parse({
      q: 123,
      campus: null,
      dietary: "vegan",
      maxPriceMinor: "not-a-number",
      storeSlug: undefined,
      page: "bad",
    });

    expect(parsed).toEqual({
      q: "",
      campus: "",
      dietary: [],
      maxPriceMinor: undefined,
      storeSlug: "",
      page: 1,
    });
  });

  it("keeps valid values and normalizes dietary tags", () => {
    const parsed = mealFiltersSchema.parse({
      q: "  grain  ",
      campus: " North Campus ",
      dietary: ["Vegetarian", "Vegetarian", "Vegan"],
      maxPriceMinor: 1500,
      storeSlug: " juniper-grain ",
      page: 2,
    });

    expect(parsed).toEqual({
      q: "grain",
      campus: "North Campus",
      dietary: ["Vegetarian", "Vegan"],
      maxPriceMinor: 1500,
      storeSlug: "juniper-grain",
      page: 2,
    });
  });
});

// Student pricing should only be discounted when the user is actually a verified student.
describe("effectivePriceMinor", () => {
  it("returns the student price for a verified student", () => {
    expect(
      effectivePriceMinor({ priceMinor: 1250, studentPriceMinor: 895 }, true),
    ).toBe(895);
  });

  it("keeps the base price for an unverified student or guest", () => {
    expect(
      effectivePriceMinor({ priceMinor: 1250, studentPriceMinor: 895 }, false),
    ).toBe(1250);
  });
});

describe("resolveDefaultCampus", () => {
  it("prefers the explicit campus when it is present", () => {
    expect(resolveDefaultCampus("North Campus", "US")).toBe("North Campus");
  });

  it("falls back to the user country code when no campus is provided", () => {
    expect(resolveDefaultCampus("", "us")).toBe("US");
  });
});

describe("formatMoney", () => {
  it("formats USD with two decimal places", () => {
    expect(formatMoney(1250, "USD", "en-US")).toBe("$12.50");
  });

  it("formats JPY without decimals because it has no minor unit", () => {
    expect(formatMoney(1250, "JPY", "en-JP")).toBe("¥1,250");
  });
});
