"use client";

import { useMemo, useState } from "react";
import type { Meal } from "./page";
import { formatMoney } from "../src/lib/money";
import { AddToCartButton } from "./_components/add-to-cart-button";

type Props = { meals: Meal[] };
const categories = ["All meals", "Bowls", "Sandwiches", "Vegetarian", "Breakfast"] as const;

export default function MealExplorer({ meals }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All meals");
  const [deliveryOnly, setDeliveryOnly] = useState(false);

  const filteredMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return meals.filter((meal) => {
      const matchesQuery = !normalizedQuery || [meal.name, meal.store, meal.neighborhood, ...meal.dietary]
        .join(" ").toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All meals" || meal.category === category;
      const matchesFulfillment = !deliveryOnly || meal.fulfillment.includes("Delivery");
      return matchesQuery && matchesCategory && matchesFulfillment;
    });
  }, [category, deliveryOnly, meals, query]);

  return (
    <section className="explorer" id="discover" aria-labelledby="discover-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Near you · 12 spots open</p>
          <h2 id="discover-heading">What are you hungry for?</h2>
        </div>
        <p className="result-count" aria-live="polite">{filteredMeals.length} {filteredMeals.length === 1 ? "result" : "results"}</p>
      </div>

      <div className="controls" role="search">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search meals, stores, or dietary needs</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals, stores, or dietary needs" />
        </label>
        <label className="delivery-toggle">
          <input type="checkbox" checked={deliveryOnly} onChange={(event) => setDeliveryOnly(event.target.checked)} />
          <span className="toggle-track" aria-hidden="true"><span /></span>
          Delivery available
        </label>
      </div>

      <div className="category-list" aria-label="Filter by category" role="group">
        {categories.map((item) => (
          <button key={item} className={category === item ? "category active" : "category"} onClick={() => setCategory(item)} type="button" aria-pressed={category === item}>
            {item}
          </button>
        ))}
      </div>

      {filteredMeals.length ? (
        <div className="meal-grid">
          {filteredMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
        </div>
      ) : (
        <div className="empty-state"><p>No meals match that search.</p><button type="button" onClick={() => { setQuery(""); setCategory("All meals"); setDeliveryOnly(false); }}>Clear filters</button></div>
      )}
    </section>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  const studentSavingsMinor = meal.priceMinor - meal.studentPriceMinor;
  return (
    <article className="meal-card">
      <div className={`meal-art ${meal.accent}`} aria-hidden="true"><span>{meal.category === "Breakfast" ? "☼" : meal.category === "Sandwiches" ? "▰" : "✳"}</span></div>
      <div className="meal-content">
        <div className="meal-title-row"><div><p className="store-name">{meal.store} <span>· {meal.neighborhood}</span></p><h3>{meal.name}</h3></div><span className="menu-arrow" aria-hidden="true">↗</span></div>
        <p className="meal-description">{meal.description}</p>
        <div className="tags" aria-label="Dietary information">
          {meal.dietary.length ? meal.dietary.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="tag">Dietary info available</span>}
        </div>
        <div className="meal-footer"><div><span className="student-price">{formatMoney(meal.studentPriceMinor, "USD")}</span><span className="regular-price">{formatMoney(meal.priceMinor, "USD")}</span><span className="price-note">student</span></div><span className="availability">{meal.available}</span></div>
        <p className="fulfillment"><span aria-hidden="true">●</span> {meal.fulfillment.join("  ·  ")}</p>
        <p className="sr-only">Save {formatMoney(studentSavingsMinor, "USD")} with a verified student account.</p>
        <AddToCartButton menuItemId={meal.id} />
      </div>
    </article>
  );
}