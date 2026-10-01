import { z } from "zod";

// The schema accepts raw URL/search params and normalizes them to safe defaults.
// This avoids a page crash when a malformed query string arrives from the browser.
const baseMealFiltersSchema = z.object({
  q: z.string().trim().default(""),
  campus: z.string().trim().default(""),
  dietary: z.array(z.string().trim()).default([]),
  maxPriceMinor: z.number().int().nonnegative().optional(),
  storeSlug: z.string().trim().default(""),
  page: z.number().int().positive().default(1),
});

export const mealFiltersSchema = z.preprocess((rawInput) => {
  const value = typeof rawInput === "object" && rawInput !== null ? rawInput : {};
  const maybeRecord = value as Record<string, unknown>;

  const dietaryInput = maybeRecord.dietary;
  const dietary = Array.isArray(dietaryInput)
    ? dietaryInput.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  const pageValue = maybeRecord.page;
  const pageNumber = typeof pageValue === "string" || typeof pageValue === "number" ? Number(pageValue) : NaN;

  const maxPriceValue = maybeRecord.maxPriceMinor;
  const numericMaxPriceMinor = typeof maxPriceValue === "string" || typeof maxPriceValue === "number"
    ? Number(maxPriceValue)
    : Number.NaN;
  const normalizedMaxPriceMinor = Number.isFinite(numericMaxPriceMinor) && numericMaxPriceMinor >= 0
    ? numericMaxPriceMinor
    : undefined;

  return {
    q: typeof maybeRecord.q === "string" ? maybeRecord.q : "",
    campus: typeof maybeRecord.campus === "string" ? maybeRecord.campus : "",
    dietary,
    maxPriceMinor: normalizedMaxPriceMinor,
    storeSlug: typeof maybeRecord.storeSlug === "string" ? maybeRecord.storeSlug : "",
    page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
  };
}, baseMealFiltersSchema.transform((value) => ({
  ...value,
  dietary: [...new Set(value.dietary)],
})));

export type MealFilters = z.infer<typeof baseMealFiltersSchema>;

// When a user does not specify a campus, we fall back to the signed-in user's location.
// This is a safe defaulting step: the page still receives a string, and the caller can override it later with auth.
export function resolveDefaultCampus(
  explicitCampus: string | undefined,
  userCountryCode?: string,
): string {
  const normalizedExplicitCampus = explicitCampus?.trim() ?? "";

  if (normalizedExplicitCampus) {
    return normalizedExplicitCampus;
  }

  const normalizedCountryCode = userCountryCode?.trim() ?? "";
  return normalizedCountryCode ? normalizedCountryCode.toUpperCase() : "";
}

export const DEFAULT_MEAL_FILTERS: MealFilters = {
  q: "",
  campus: "",
  dietary: [],
  maxPriceMinor: undefined,
  storeSlug: "",
  page: 1,
};
