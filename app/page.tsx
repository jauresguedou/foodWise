import Link from "next/link";
import MealExplorer from "./meal-explorer";

export type Meal = {
  id: string;
  storeId: string;
  name: string;
  store: string;
  neighborhood: string;
  category: "Bowls" | "Sandwiches" | "Vegetarian" | "Breakfast";
  priceMinor: number;
  studentPriceMinor: number;
  available: string;
  fulfillment: string[];
  dietary: string[];
  description: string;
  accent: string;
};

const meals: Meal[] = [
  {
    id: "harvest-bowl",
    storeId: "store-juniper-grain",
    name: "Harvest grain bowl",
    store: "Juniper & Grain",
    neighborhood: "North Campus",
    category: "Bowls",
    priceMinor: 1250,
    studentPriceMinor: 895,
    available: "Ready in 10-15 min",
    fulfillment: ["Pickup", "Delivery"],
    dietary: ["Vegetarian", "Gluten-free"],
    description: "Roasted squash, farro, greens, pepitas, and lemon tahini.",
    accent: "sage",
  },
  {
    id: "sunrise-breakfast",
    storeId: "store-daily-table",
    name: "Sunrise breakfast wrap",
    store: "The Daily Table",
    neighborhood: "Library District",
    category: "Breakfast",
    priceMinor: 975,
    studentPriceMinor: 650,
    available: "Ready in 5-10 min",
    fulfillment: ["Pickup"],
    dietary: ["Vegetarian"],
    description: "Eggs, cheddar, black beans, roasted salsa, and avocado crema.",
    accent: "gold",
  },
  {
    id: "spicy-chicken",
    storeId: "store-lantern-kitchen",
    name: "Spicy chicken banh mi",
    store: "Lantern Kitchen",
    neighborhood: "East Village",
    category: "Sandwiches",
    priceMinor: 1125,
    studentPriceMinor: 799,
    available: "Ready in 15-20 min",
    fulfillment: ["Pickup", "Delivery"],
    dietary: [],
    description: "Lemongrass chicken, pickled vegetables, cucumber, and chili mayo.",
    accent: "coral",
  },
  {
    id: "green-pasta",
    storeId: "store-olive-rye",
    name: "Green goddess pasta",
    store: "Olive & Rye",
    neighborhood: "West End",
    category: "Vegetarian",
    priceMinor: 1300,
    studentPriceMinor: 850,
    available: "Ready in 20-25 min",
    fulfillment: ["Pickup", "Delivery"],
    dietary: ["Vegetarian", "Contains dairy"],
    description: "Basil pesto, broccoli, peas, parmesan, and toasted breadcrumbs.",
    accent: "mint",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FoodWise home">
          <span className="brand-mark" aria-hidden="true">FW</span>
          <span>food<span>wise</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#discover">Discover</a>
          <a href="/cart">Cart</a>
          <Link href="/orders">Your orders</Link>
        </nav>
        <Link className="profile-button" href="/login" aria-label="Sign in">JS</Link>
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
