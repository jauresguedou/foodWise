import { beforeEach, describe, expect, it, vi } from "vitest";

describe("support application workflow", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects incomplete or non-consented requests", async () => {
    const { submitSupportApplicationCommand } = await import("@/src/server/actions/support");

    const result = await submitSupportApplicationCommand(
      {
        studentId: "student-1",
        supportType: "MEAL_SUPPORT",
        needsSummary: "Need food",
        consentGiven: false,
      },
      "student-1",
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected the submission to be rejected.");
    }
    expect(result.message.toLowerCase()).toMatch(/consent|summary|required/i);
  });

  it("prevents duplicate submissions for the same student and period", async () => {
    const { submitSupportApplicationCommand } = await import("@/src/server/actions/support");

    const payload = {
      studentId: "student-2",
      supportType: "MEAL_SUPPORT",
      needsSummary: "I have not had dependable access to fresh meals this week.",
      consentGiven: true,
      requestedAmountMinor: 2500,
      period: "2026-W1",
    };

    const first = await submitSupportApplicationCommand(payload, "student-2");
    const second = await submitSupportApplicationCommand(payload, "student-2");

    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.data.id).toBeTruthy();
    }
    expect(second.ok).toBe(false);
    if (second.ok) {
      throw new Error("Expected the duplicate submission to be rejected.");
    }
    expect(second.message.toLowerCase()).toMatch(/duplicate|already/i);
  });

  it("records reviewer decisions in the audit trail", async () => {
    const { reviewSupportApplicationCommand, submitSupportApplicationCommand } = await import("@/src/server/actions/support");

    const created = await submitSupportApplicationCommand(
      {
        studentId: "student-3",
        supportType: "EMERGENCY_LOAN",
        needsSummary: "I need support after a month of lost work hours and rent pressure.",
        consentGiven: true,
        requestedAmountMinor: 5000,
        period: "2026-W2",
      },
      "student-3",
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error("Expected the support application to be created.");
    }

    const review = await reviewSupportApplicationCommand(
      {
        applicationId: created.data.id,
        decision: "APPROVED",
        reason: "Applicant has demonstrated documented need.",
        reviewerRole: "REVIEWER",
      },
      "reviewer-1",
    );

    expect(review.ok).toBe(true);
    if (!review.ok) {
      throw new Error("Expected the reviewer decision to succeed.");
    }
    expect(review.data.status).toBe("APPROVED");
    expect(review.data.auditHistory.at(-1)?.reason).toBe("Applicant has demonstrated documented need.");
  });

  it("keeps support records private to the student or an authorized reviewer", async () => {
    const { submitSupportApplicationCommand } = await import("@/src/server/actions/support");
    const { getSupportApplicationById, listSupportApplications } = await import("@/src/server/queries/support");

    const created = await submitSupportApplicationCommand(
      {
        studentId: "student-4",
        supportType: "MEAL_SUPPORT",
        needsSummary: "My budget is limited this month because I am balancing tuition and rent.",
        consentGiven: true,
        period: "2026-W3",
      },
      "student-4",
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error("Expected the support application to be created.");
    }
    expect(getSupportApplicationById(created.data.id, "student-4", false)?.studentId).toBe("student-4");
    expect(getSupportApplicationById(created.data.id, "student-99", false)).toBeNull();
    expect(listSupportApplications("student-4", false).length).toBeGreaterThan(0);
  });

  it("accepts the approved loan terms only after the reviewer approval", async () => {
    const { acceptLoanTermsCommand, reviewSupportApplicationCommand, submitSupportApplicationCommand } = await import("@/src/server/actions/support");

    const created = await submitSupportApplicationCommand(
      {
        studentId: "student-5",
        supportType: "EMERGENCY_LOAN",
        needsSummary: "I am facing an unexpected gap between rent and payday for the next two weeks.",
        consentGiven: true,
        requestedAmountMinor: 8000,
        period: "2026-W4",
      },
      "student-5",
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error("Expected the support application to be created.");
    }

    const approved = await reviewSupportApplicationCommand(
      {
        applicationId: created.data.id,
        decision: "APPROVED",
        reason: "Loan is within the established hardship cap.",
        reviewerRole: "REVIEWER",
      },
      "reviewer-1",
    );

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      throw new Error("Expected the reviewer decision to succeed.");
    }

    const accepted = await acceptLoanTermsCommand(
      {
        applicationId: created.data.id,
        acceptedAt: new Date().toISOString(),
        acknowledgedTerms: true,
      },
      "student-5",
    );

    expect(accepted.ok).toBe(true);
    if (!accepted.ok) {
      throw new Error("Expected the loan terms to be accepted.");
    }
    expect(accepted.data.loanTerms?.acceptedAt).toBeTruthy();
  });
});
