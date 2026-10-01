import { mealFiltersSchema, type MealFilters } from "@/src/validation/meal-filters";

// Store queries mirror the meal queries but are oriented around a vendor store profile.
// They hide unpublished stores and keep the payload focused on public store data.
type StoreRecord = {
  id: string;
  slug: string;
  name: string;
  campus: string;
  currency: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "DRAFT";
  menu: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    dietaryTags: string[];
    priceMinor: number;
    studentPriceMinor: number | null;
    isAvailable: boolean;
    archivedAt: string | null;
  }>;
};

const demoStores: StoreRecord[] = [
  {
    id: "s1",
    slug: "juniper-grain",
    name: "Juniper & Grain",
    campus: "North Campus",
    currency: "USD",
    status: "PUBLISHED",
    menu: [
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
      },
    ],
  },
  {
    id: "s2",
    slug: "daily-table",
    name: "The Daily Table",
    campus: "Library District",
    currency: "USD",
    status: "PUBLISHED",
    menu: [
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
      },
    ],
  },
  {
    id: "s3",
    slug: "olive-rye",
    name: "Olive & Rye",
    campus: "West End",
    currency: "USD",
    status: "PUBLISHED",
    menu: [
      {
        id: "m4",
        name: "Green goddess pasta",
        description: "Broccoli, peas, parmesan, and basil pesto.",
        category: "Vegetarian",
        dietaryTags: ["Vegetarian"],
        priceMinor: 1300,
        studentPriceMinor: 850,
        isAvailable: true,
        archivedAt: "2025-02-05T12:00:00Z",
      },
    ],
  },
];

export type StoreListItem = {
  slug: string;
  name: string;
  campus: string;
  currency: string;
  menuCount: number;
};

export type StoreQueryResult = {
  stores: StoreListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

// Route and query params are untrusted input, so we normalize the slug before it reaches the public query layer.
export function normalizeStoreSlug(rawValue: string | undefined | null): string {
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

export function getStores(filters: unknown, catalog: StoreRecord[] = demoStores): StoreQueryResult {
  const parsed: MealFilters = mealFiltersSchema.parse(filters ?? {});
  const normalizedQuery = parsed.q.toLowerCase();

  const visibleStores = catalog.filter((store) => {
    if (store.status !== "PUBLISHED") {
      return false;
    }

    if (parsed.campus && store.campus !== parsed.campus) {
      return false;
    }

    if (parsed.storeSlug && store.slug !== parsed.storeSlug) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [store.name, store.slug, store.campus].join(" ").toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  const page = Math.max(1, parsed.page ?? 1);
  const startIndex = (page - 1) * 24;
  const paginatedStores = visibleStores.slice(startIndex, startIndex + 24);

  return {
    stores: paginatedStores.map((store) => ({
      slug: store.slug,
      name: store.name,
      campus: store.campus,
      currency: store.currency,
      menuCount: store.menu.filter((item) => !item.archivedAt).length,
    })),
    totalCount: visibleStores.length,
    page,
    pageSize: 24,
  };
}

export function getStoreBySlug(storeSlug: string, catalog: StoreRecord[] = demoStores): StoreRecord | null {
  const store = catalog.find((entry) => entry.slug === storeSlug && entry.status === "PUBLISHED");

  if (!store) {
    return null;
  }

  return {
    ...store,
    // Unavailable items remain visible on the store page so a vendor can show the full menu state,
    // but the default /meals listing still excludes them to keep discovery clean.
    menu: store.menu.filter((item) => !item.archivedAt),
  };
}
