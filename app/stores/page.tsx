import Link from "next/link";

import { getStores } from "@/src/server/queries/stores";
import { mealFiltersSchema, resolveDefaultCampus } from "@/src/validation/meal-filters";

type StoresPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// This list page is the public-facing store directory for the marketplace.
// It reads from the server query, ensures only published stores are shown, and keeps the payload compact.
export default async function StoresPage({ searchParams }: StoresPageProps) {
  // Next.js 16 resolves search params as a Promise, so we await them before validation and query execution.
  const params = searchParams ? await searchParams : {};
  const parsedFilters = mealFiltersSchema.parse({
    q: typeof params.q === "string" ? params.q : "",
    campus: resolveDefaultCampus(typeof params.campus === "string" ? params.campus : undefined, undefined),
    page: typeof params.page === "string" ? Number(params.page) : 1,
  });

  const result = getStores(parsedFilters);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ margin: 0, color: "#758172", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Community kitchens
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "2.5rem" }}>Browse campus stores</h1>
      </header>

      <section aria-label="Store directory" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {result.stores.map((store) => (
          <Link
            key={store.slug}
            href={`/stores/${store.slug}`}
            style={{
              display: "block",
              background: "#fff",
              border: "1px solid #dfe2d9",
              borderRadius: 18,
              padding: "1.25rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <div>
                <p style={{ margin: 0, color: "#758172", fontSize: 11, textTransform: "uppercase" }}>{store.campus}</p>
                <h2 style={{ margin: "0.4rem 0 0", fontSize: "1.5rem" }}>{store.name}</h2>
              </div>
              <span
                style={{
                  background: "#e5f1e8",
                  color: "#285742",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "0.35rem 0.6rem",
                }}
              >
                {store.menuCount} items
              </span>
            </div>

            <p style={{ margin: "0.9rem 0 0", color: "#68736b" }}>
              {store.currency} · public menu available
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
