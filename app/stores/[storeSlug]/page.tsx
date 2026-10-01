import Link from "next/link";
import { notFound } from "next/navigation";

import { getStoreBySlug, normalizeStoreSlug } from "@/src/server/queries/stores";

// This page is the store-specific view described in the issue 5 requirements.
// Unlike the list page, the store page may include unavailable items and show them as unavailable instead of hiding them.
export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const normalizedStoreSlug = normalizeStoreSlug(storeSlug);

  if (!normalizedStoreSlug) {
    notFound();
  }

  const store = getStoreBySlug(normalizedStoreSlug);

  if (!store) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <Link href="/" style={{ color: "#285742", fontWeight: 700 }}>
        ← Back to meals
      </Link>

      <header style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
        <p style={{ margin: 0, color: "#758172", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Store / {store.campus}
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "2.5rem" }}>{store.name}</h1>
      </header>

      <section aria-label="Store menu" style={{ display: "grid", gap: "1rem" }}>
        {store.menu.map((item) => (
          <article
            key={item.id}
            style={{
              border: "1px solid #dfe2d9",
              background: "#fff",
              padding: "1rem 1.25rem",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{item.name}</h2>
                <p style={{ margin: "0.5rem 0 0", color: "#68736b" }}>{item.description}</p>
              </div>

              <strong style={{ fontSize: "1.1rem" }}>
                ${((item.studentPriceMinor ?? item.priceMinor) / 100).toFixed(2)}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", alignItems: "center" }}>
              <span style={{ color: "#68736b" }}>{item.category}</span>
              <span
                style={{
                  color: item.isAvailable ? "#285742" : "#8a5b2d",
                  background: item.isAvailable ? "#e5f1e8" : "#f8ecdb",
                  padding: "0.35rem 0.6rem",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
