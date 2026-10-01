import Link from "next/link";

import { reviewSupportApplication } from "@/src/server/actions/support";
import { getSupportApplicationById } from "@/src/server/queries/support";

export default async function SupportApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const application = getSupportApplicationById(applicationId, "student-demo", false);

  if (!application) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <h1>Application not found</h1>
        <Link href="/support">Return to support</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <Link href="/support" style={{ color: "#285742", fontWeight: 700 }}>
        ← Back to support
      </Link>

      <article style={{ marginTop: "1.5rem", border: "1px solid #dfe2d9", background: "#fff", borderRadius: 18, padding: "1.5rem" }}>
        <p style={{ margin: 0, color: "#758172", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {application.supportType}
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "2.3rem" }}>{application.period}</h1>
        <p style={{ marginTop: "0.75rem", color: "#68736b" }}>Status: {application.status}</p>

        <div style={{ marginTop: "1.25rem" }}>
          <h2>Needs summary</h2>
          <p>{application.needsSummary}</p>
        </div>

        {application.loanTerms ? (
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid #edf0eb", paddingTop: "1.25rem" }}>
            <h2>Loan terms</h2>
            <p>Principal: {application.loanTerms.principalMinor}</p>
            <p>Fee: {application.loanTerms.feeMinor}</p>
            <p>Repayment: {application.loanTerms.repaymentPlan}</p>
            <p>Accepted: {application.loanTerms.acceptedAt ?? "Not yet accepted"}</p>
          </div>
        ) : null}

        <form action={reviewSupportApplication} style={{ marginTop: "1.5rem", display: "grid", gap: "0.9rem" }}>
          <input type="hidden" name="applicationId" value={application.id} />
          <input type="hidden" name="reviewerRole" value="REVIEWER" />
          <div>
            <label htmlFor="decision">Decision</label>
            <select id="decision" name="decision" defaultValue="APPROVED" style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0" }}>
              <option value="APPROVED">Approved</option>
              <option value="DECLINED">Declined</option>
              <option value="REFERRED">Referred</option>
            </select>
          </div>
          <div>
            <label htmlFor="reason">Reason</label>
            <textarea id="reason" name="reason" defaultValue="Application reviewed and approved for support." rows={4} style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 12, border: "1px solid #cfd7d0" }} />
          </div>
          <button type="submit" style={{ maxWidth: 220, background: "#285742", color: "#fff", padding: "0.8rem 1.1rem", border: 0, borderRadius: 12, fontWeight: 700 }}>
            Review application
          </button>
        </form>
      </article>
    </main>
  );
}
