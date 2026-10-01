import { effectivePriceMinor, formatMoney } from "@/src/lib/money";
import { mealFiltersSchema, type MealFilters } from "@/src/validation/meal-filters";

// This query reads the menu data needed for listing pages.
// The result intentionally omits private vendor data and only exposes fields the UI needs.
type StoreSummary = {
  id: string;
  slug: string;
  name: string;
  campus: string;
  currency: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "DRAFT";
};

type MenuItemRecord = {
  id: string;
  name: string;
  description: string;
  category: string;
  dietaryTags: string[];
  priceMinor: number;
  studentPriceMinor: number | null;
  isAvailable: boolean;
  archivedAt: string | null;
  store: StoreSummary;
};

export const MEAL_PAGE_SIZE = 24;

const demoMenu: MenuItemRecord[] = [
  {
    id: "m1",
    name: "Harvest grain bowl",
    description: "Roasted squash and farro with greens and tahini.",
    category: "Bowls",
    dietaryTags: ["Vegetarian", "Gluten-free"],
    priceMinor: 1250,
    studentPriceMinor: 895,
    isAvailable: true,
    archivedAt: null,
    store: {
      id: "s1",
      slug: "juniper-grain",
      name: "Juniper & Grain",
      campus: "North Campus",
      currency: "USD",
      status: "PUBLISHED",
    },
  },
  {
    id: "m2",
    name: "Crispy tofu greens",
    description: "Tofu, brown rice, cabbage, and sesame-lime dressing.",
    category: "Bowls",
    dietaryTags: ["Vegan", "Dairy-free"],
    priceMinor: 1100,
    studentPriceMinor: 850,
    isAvailable: false,
    archivedAt: null,
    store: {
      id: "s1",
      slug: "juniper-grain",
      name: "Juniper & Grain",
      campus: "North Campus",
      currency: "USD",
      status: "PUBLISHED",
    },
  },
  {
    id: "m3",
    name: "Sunrise breakfast wrap",
    description: "Eggs, cheddar, black beans, and avocado crema.",
    category: "Breakfast",
    dietaryTags: ["Vegetarian"],
    priceMinor: 975,
    studentPriceMinor: 650,
    isAvailable: true,
    archivedAt: null,
    store: {
      id: "s2",
      slug: "daily-table",
      name: "The Daily Table",
      campus: "Library District",
      currency: "USD",
      status: "PUBLISHED",
    },
  },
  {
    id: "m4",
    name: "Green goddess pasta",
    description: "Broccoli, peas, parmesan, and basil pesto.",
    category: "Vegetarian",
    dietaryTags: ["Vegetarian", "Contains dairy"],
    priceMinor: 1300,
    studentPriceMinor: 850,
    isAvailable: true,
    archivedAt: "2025-02-05T12:00:00Z",
    store: {
      id: "s3",
      slug: "olive-rye",
      name: "Olive & Rye",
      campus: "West End",
      currency: "USD",
      status: "PUBLISHED",
    },
  },
  {
    id: "m5",
    name: "Spicy chicken banh mi",
    description: "Lemongrass chicken with pickled vegetables and chili mayo.",
    category: "Sandwiches",
    dietaryTags: [],
    priceMinor: 1125,
    studentPriceMinor: 799,
    isAvailable: true,
    archivedAt: null,
    store: {
      id: "s4",
      slug: "lantern-kitchen",
      name: "Lantern Kitchen",
      campus: "East Village",
      currency: "USD",
      status: "PENDING_REVIEW",
    },
  },
];

// This projection is intentionally minimal: it exposes only the fields a public meal list needs.
// Sensitive vendor fields like owner email or password hashes are never returned from the query result.
export type MealListItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  dietaryTags: string[];
  priceMinor: number;
  displayPriceMinor: number;
  currency: string;
  isAvailable: boolean;
  store: {
    slug: string;
    name: string;
    campus: string;
    currency: string;
  };
};

export type MealQueryResult = {
  items: MealListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

// Route params are untrusted input. Normalize the menu item id before it is used for lookup.
export function normalizeMenuItemId(rawValue: string | undefined | null): string {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toMealListItem(item: MenuItemRecord, isVerifiedStudent: boolean): MealListItem {
  const displayPriceMinor = effectivePriceMinor(item, isVerifiedStudent);

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    dietaryTags: item.dietaryTags,
    priceMinor: item.priceMinor,
    displayPriceMinor,
    currency: item.store.currency,
    isAvailable: item.isAvailable,
    store: {
      slug: item.store.slug,
      name: item.store.name,
      campus: item.store.campus,
      currency: item.store.currency,
    },
  };
}

function matchesDietary(item: MenuItemRecord, dietary: string[]): boolean {
  if (dietary.length === 0) {
    return true;
  }

  return dietary.every((tag) => item.dietaryTags.includes(tag));
}

// A page should only see the menu items it is allowed to access.
// Published stores are eligible, archived items are filtered out, and unavailable items are hidden by default.
export function getMeals(filters: unknown, catalog: MenuItemRecord[] = demoMenu, isVerifiedStudent = false): MealQueryResult {
  const parsed: MealFilters = mealFiltersSchema.parse(filters ?? {});
  const normalizedQuery = parsed.q.toLowerCase();

  const visibleItems = catalog.filter((item) => {
    if (item.store.status !== "PUBLISHED") {
      return false;
    }

    if (item.archivedAt) {
      return false;
    }

    if (parsed.storeSlug && item.store.slug !== parsed.storeSlug) {
      return false;
    }

    if (parsed.campus && item.store.campus !== parsed.campus) {
      return false;
    }

    if (!matchesDietary(item, parsed.dietary)) {
      return false;
    }

    // maxPriceMinor is only used when a campus is selected, matching the spec's currency guard.
    if (parsed.campus && parsed.maxPriceMinor != null && effectivePriceMinor(item, isVerifiedStudent) > parsed.maxPriceMinor) {
      return false;
    }

    if (!item.isAvailable) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [item.name, item.description, item.store.name, item.store.campus, ...item.dietaryTags]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const page = Math.max(1, parsed.page ?? 1);
  // Pagination is explicit here: the UI gets the current slice and the total size of the full filtered set.
  // This lets the page show the right page count without re-running private logic in the client.
  const startIndex = (page - 1) * MEAL_PAGE_SIZE;
  const paginatedItems = visibleItems.slice(startIndex, startIndex + MEAL_PAGE_SIZE);

  return {
    items: paginatedItems.map((item) => toMealListItem(item, isVerifiedStudent)),
    totalCount: visibleItems.length,
    page,
    pageSize: MEAL_PAGE_SIZE,
  };
}

export function getMealById(menuItemId: string, catalog: MenuItemRecord[] = demoMenu, isVerifiedStudent = false): MealListItem | null {
  const normalizedMenuItemId = normalizeMenuItemId(menuItemId);
  const item = catalog.find((entry) => normalizeMenuItemId(entry.id) === normalizedMenuItemId && entry.store.status === "PUBLISHED" && !entry.archivedAt);

  if (!item) {
    return null;
  }

  return toMealListItem(item, isVerifiedStudent);
}

export function getMealPriceLabel(item: { priceMinor: number; studentPriceMinor?: number | null }, isVerifiedStudent: boolean): string {
  const displayPrice = effectivePriceMinor(item, isVerifiedStudent);
  return formatMoney(displayPrice, "USD");
}
