import MealExplorer from "./meal-explorer";
import Link from "next/link";

import { getMeals } from "@/src/server/queries/meals";
import { mealFiltersSchema, resolveDefaultCampus } from "@/src/validation/meal-filters";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// The page now gets its data from the server query layer instead of a local hardcoded array.
// This keeps the UI aligned with the issue 5 read rules: filtered, validated, and currency-safe.
export type Meal = {
  id: string;
  name: string;
  store: string;
  neighborhood: string;
  category: "Bowls" | "Sandwiches" | "Vegetarian" | "Breakfast";
  price: number;
  studentPrice: number;
  available: string;
  fulfillment: string[];
  dietary: string[];
  description: string;
  accent: string;
};

function toExplorerMeals(items: Awaited<ReturnType<typeof getMeals>>["items"]): Meal[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    store: item.store.name,
    neighborhood: item.store.campus,
    category: item.category as Meal["category"],
    price: item.priceMinor / 100,
    studentPrice: item.displayPriceMinor / 100,
    available: item.isAvailable ? "Ready in 10-15 min" : "Currently unavailable",
    fulfillment: ["Pickup"],
    dietary: item.dietaryTags,
    description: item.description,
    accent: item.category === "Breakfast" ? "gold" : item.category === "Sandwiches" ? "coral" : item.category === "Vegetarian" ? "mint" : "sage",
  }));
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Next.js 16 passes search params as a Promise, so the page must await them before creating the server query.
  // We validate and normalize the params here so the query layer receives only safe values.
  const params = searchParams ? await searchParams : {};
  const dietary = Array.isArray(params.dietary)
    ? params.dietary.flatMap((item) => (typeof item === "string" ? [item] : []))
    : typeof params.dietary === "string"
      ? [params.dietary]
      : [];

  const parsedFilters = mealFiltersSchema.parse({
    q: typeof params.q === "string" ? params.q : "",
    campus: resolveDefaultCampus(typeof params.campus === "string" ? params.campus : undefined, undefined),
    dietary,
    maxPriceMinor: typeof params.maxPriceMinor === "string" ? Number(params.maxPriceMinor) : undefined,
    storeSlug: typeof params.storeSlug === "string" ? params.storeSlug : "",
    page: typeof params.page === "string" ? Number(params.page) : 1,
  });

  const result = getMeals(parsedFilters, undefined, false);
  const meals = toExplorerMeals(result.items);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FoodWise home">
          <span className="brand-mark" aria-hidden="true">FW</span>
          <span>food<span>wise</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#discover">Discover</a>
          <a href="#orders">Your orders</a>
          
        </nav>
        <div className="header-actions">
          <Link className="workspace-switch" href="/stores">Stores</Link>
          <Link className="workspace-switch" href="/support">Support & Loan</Link>
          <Link className="workspace-switch" href="/vendor">Vendor workspace</Link>
          <button className="profile-button" type="button" aria-label="Open profile menu">JS</button>
        </div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Good food. Better prices.</p>
          <h1>Find your next<br /><em>favorite meal.</em></h1>
          <p className="hero-intro">Student-priced meals from the spots around campus, ready when you are.</p>
        </div>
        <div className="hero-note" aria-label="FoodWise promise">
          <span className="note-icon" aria-hidden="true">✦</span>
          <p><strong>Made for student budgets</strong><br />Every price shown includes your student rate.</p>
        </div>
      </section>
      <MealExplorer meals={meals} />
    </main>
  );
}
