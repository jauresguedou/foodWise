import Link from "next/link";

import { submitSupportApplication } from "@/src/server/actions/support";
import { listSupportApplications } from "@/src/server/queries/support";

export default async function SupportPage() {
  const applications = listSupportApplications("student-demo", false);
  const nextPeriod = (() => {
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const diffInDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const weekNumber = Math.max(1, Math.min(52, Math.ceil((diffInDays + startOfYear.getUTCDay() + 1) / 7) + 2));
    return `${now.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
  })();

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, color: "#758172", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Student support
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "2.4rem" }}>Meal support and emergency loan requests</h1>
      </header>

      <section style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1.2fr 0.8fr" }}>
        <form action={submitSupportApplication} style={{ border: "1px solid #dfe2d9", background: "#fff", borderRadius: 18, padding: "1.5rem" }}>
          <input type="hidden" name="studentId" value="student-demo" />
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label htmlFor="supportType" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Support type</label>
              <select id="supportType" name="supportType" defaultValue="MEAL_SUPPORT" style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0" }}>
                <option value="MEAL_SUPPORT">Meal support</option>
                <option value="EMERGENCY_LOAN">Emergency loan</option>
              </select>
            </div>

            <div>
              <label htmlFor="period" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Support period</label>
              <input id="period" name="period" defaultValue={nextPeriod} style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0" }} />
              <small style={{ display: "block", marginTop: 8, color: "#68736b" }}>
                One support request per student and period. Pick a new period for a fresh application.
              </small>
            </div>

            <div>
              <label htmlFor="requestedAmountMinor" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Requested amount (minor units)</label>
              <input id="requestedAmountMinor" name="requestedAmountMinor" type="number" min="0" defaultValue="2500" style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0" }} />
            </div>

            <div>
              <label htmlFor="needsSummary" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Tell us what you need</label>
              <textarea id="needsSummary" name="needsSummary" defaultValue="I need help covering groceries for the next week while I recover from an unexpected schedule change." rows={5} style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0", resize: "vertical" }} />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#3e4c46" }}>
              <input type="checkbox" name="consentGiven" value="true" defaultChecked />
              <span>I understand how this information is used, who can access it, and how to request correction or support.</span>
            </label>

            <button type="submit" style={{ background: "#285742", color: "#fff", padding: "0.8rem 1.1rem", border: 0, borderRadius: 12, fontWeight: 700 }}>
              Submit support request
            </button>
          </div>
        </form>

        <aside style={{ border: "1px solid #dfe2d9", background: "#fff", borderRadius: 18, padding: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>Your recent applications</h2>
          {applications.length === 0 ? (
            <p>No applications yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.9rem" }}>
              {applications.map((application) => (
                <li key={application.id} style={{ border: "1px solid #edf0eb", borderRadius: 12, padding: "0.9rem" }}>
                  <Link href={`/support/${application.id}`} style={{ color: "#285742", fontWeight: 700 }}>
                    {application.supportType}
                  </Link>
                  <p style={{ margin: "0.5rem 0 0", color: "#68736b" }}>{application.status}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </main>
  );
}
