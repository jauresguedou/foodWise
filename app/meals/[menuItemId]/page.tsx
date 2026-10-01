import Link from "next/link";
import { notFound } from "next/navigation";

import { getMealById, normalizeMenuItemId } from "@/src/server/queries/meals";

// This page is the public meal detail route described in the issue 5 and issue 7 specs.
// The route param is normalized before lookup so malformed ids are treated as missing.
type MealDetailPageProps = {
  params: Promise<{ menuItemId: string }>;
};

export default async function MealDetailPage({ params }: MealDetailPageProps) {
  const { menuItemId } = await params;
  const normalizedMenuItemId = normalizeMenuItemId(menuItemId);

  if (!normalizedMenuItemId) {
    notFound();
  }

  const meal = getMealById(normalizedMenuItemId);

  if (!meal) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <Link href="/" style={{ color: "#285742", fontWeight: 700 }}>
        ← Back to meals
      </Link>

      <article style={{ marginTop: "1.5rem", border: "1px solid #dfe2d9", background: "#fff", borderRadius: 20, padding: "1.5rem" }}>
        <p style={{ margin: 0, color: "#758172", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {meal.store.campus}
        </p>
        <h1 style={{ margin: "0.4rem 0 0", fontSize: "2.5rem" }}>{meal.name}</h1>

        <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "1.5rem" }}>${(meal.displayPriceMinor / 100).toFixed(2)}</strong>
          <span style={{ color: "#68736b" }}>from {meal.store.name}</span>
        </div>

        <p style={{ marginTop: "1rem", color: "#4b564f", lineHeight: 1.7 }}>{meal.description}</p>

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {meal.dietaryTags.length === 0 ? (
            <span style={{ color: "#68736b" }}>No dietary tags</span>
          ) : (
            meal.dietaryTags.map((tag) => (
              <span key={tag} style={{ background: "#eef3eb", color: "#285742", padding: "0.35rem 0.7rem", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                {tag}
              </span>
            ))
          )}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href={`/stores/${meal.store.slug}`} style={{ color: "#285742", fontWeight: 700 }}>
            View store →
          </Link>
        </div>
      </article>
    </main>
  );
}
