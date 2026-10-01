"use server";

import { randomUUID } from "node:crypto";

import {
  loanAcceptanceSchema,
  reviewSupportApplicationSchema,
  supportApplicationSchema,
  type LoanAcceptanceInput,
  type ReviewSupportApplicationInput,
  type SupportApplicationInput,
} from "@/src/validation/support-application";
import {
  getSupportApplicationStore,
  type SupportApplication,
  type SupportStatus,
} from "@/src/server/queries/support";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors?: Record<string, string[]>; message: string };

function normalizeRecord(input: FormData | Record<string, unknown> | unknown): Record<string, unknown> {
  if (input instanceof FormData) {
    return Object.fromEntries(Array.from(input.entries()).map(([key, value]) => [key, value]));
  }

  if (typeof input === "object" && input !== null) {
    return input as Record<string, unknown>;
  }

  return {};
}

function parseSupportInput(input: FormData | Record<string, unknown> | unknown, currentStudentId: string): SupportApplicationInput {
  const value = normalizeRecord(input);

  const requestAmountValue = value.requestedAmountMinor;
  const requestedAmountMinor = typeof requestAmountValue === "string"
      ? Number(requestAmountValue)
      : typeof requestAmountValue === "number"
        ? requestAmountValue
        : 0;

  return {
    studentId: typeof value.studentId === "string" ? value.studentId : currentStudentId,
    supportType: (typeof value.supportType === "string" ? value.supportType : "MEAL_SUPPORT") as SupportApplicationInput["supportType"],
    needsSummary: typeof value.needsSummary === "string" ? value.needsSummary : "",
    consentGiven: typeof value.consentGiven === "string" ? value.consentGiven === "true" : Boolean(value.consentGiven),
    requestedAmountMinor,
    period: typeof value.period === "string" ? value.period : new Date().toISOString().slice(0, 10),
  };
}

function buildAuditEntry(
  actorId: string,
  actorRole: "STUDENT" | "REVIEWER",
  action: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DECLINED" | "REFERRED" | "LOAN_ACCEPTED",
  reason: string,
  statusFrom: SupportStatus,
  statusTo: SupportStatus,
): SupportApplication["auditHistory"][number] {
  return {
    actorId,
    actorRole,
    action,
    timestamp: new Date().toISOString(),
    reason,
    statusFrom,
    statusTo,
    correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
  };
}

export async function submitSupportApplicationCommand(
  input: FormData | Record<string, unknown> | unknown,
  currentStudentId = "student-demo",
): Promise<ActionResult<SupportApplication>> {
  const normalizedInput = parseSupportInput(input, currentStudentId);
  const parsed = supportApplicationSchema.safeParse(normalizedInput);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the required support details before submitting.",
    };
  }

  const payload = parsed.data;
  const existingStore = getSupportApplicationStore();
  const duplicate = existingStore.find(
    (application) =>
      application.studentId === payload.studentId &&
      application.supportType === payload.supportType &&
      application.period === payload.period &&
      application.status !== "DECLINED",
  );

  if (duplicate) {
    return {
      ok: false,
      message: "A duplicate support application already exists for this student and period.",
    };
  }

  const now = new Date().toISOString();
  const application: SupportApplication = {
    id: `sa-${randomUUID()}`,
    studentId: payload.studentId,
    supportType: payload.supportType,
    needsSummary: payload.needsSummary,
    consentGiven: payload.consentGiven,
    requestedAmountMinor: payload.requestedAmountMinor,
    period: payload.period,
    status: "SUBMITTED",
    createdAt: now,
    updatedAt: now,
    auditHistory: [
      buildAuditEntry(payload.studentId, "STUDENT", "SUBMITTED", "Application submitted.", "SUBMITTED", "SUBMITTED"),
    ],
    loanTerms:
      payload.supportType === "EMERGENCY_LOAN"
        ? {
            principalMinor: payload.requestedAmountMinor,
            feeMinor: Math.round(payload.requestedAmountMinor * 0.05),
            repaymentPlan: "4 equal weekly installments after the support period ends.",
            dueDates: [
              "2026-02-14T00:00:00.000Z",
              "2026-02-21T00:00:00.000Z",
              "2026-02-28T00:00:00.000Z",
              "2026-03-07T00:00:00.000Z",
            ],
            acceptedAt: null,
            consentText: "I understand the repayment expectations, hardship options, and support contact channels before accepting these terms.",
          }
        : undefined,
  };

  existingStore.push(application);

  return { ok: true, data: application };
}

export async function reviewSupportApplicationCommand(
  input: FormData | Record<string, unknown> | unknown,
  reviewerId = "reviewer-demo",
): Promise<ActionResult<SupportApplication>> {
  const value = normalizeRecord(input);
  const parsed = reviewSupportApplicationSchema.safeParse({
    applicationId: value.applicationId,
    decision: value.decision,
    reason: value.reason,
    reviewerRole: value.reviewerRole ?? "REVIEWER",
  } as ReviewSupportApplicationInput);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Reviewer input is incomplete.",
    };
  }

  const data = parsed.data;
  const store = getSupportApplicationStore();
  const application = store.find((entry) => entry.id === data.applicationId);

  if (!application) {
    return {
      ok: false,
      message: "The requested application could not be found.",
    };
  }

  const previousStatus = application.status;
  const nextStatus: SupportStatus = data.decision === "APPROVED"
    ? "APPROVED"
    : data.decision === "DECLINED"
      ? "DECLINED"
      : "REFERRED";

  application.status = nextStatus;
  application.updatedAt = new Date().toISOString();
  application.auditHistory.push(
    buildAuditEntry(reviewerId, "REVIEWER", data.decision, data.reason, previousStatus, nextStatus),
  );

  if (application.supportType === "EMERGENCY_LOAN" && data.decision === "APPROVED") {
    application.loanTerms = application.loanTerms ?? {
      principalMinor: application.requestedAmountMinor,
      feeMinor: Math.round(application.requestedAmountMinor * 0.05),
      repaymentPlan: "4 equal weekly installments after the support period ends.",
      dueDates: [
        "2026-02-14T00:00:00.000Z",
        "2026-02-21T00:00:00.000Z",
        "2026-02-28T00:00:00.000Z",
        "2026-03-07T00:00:00.000Z",
      ],
      acceptedAt: null,
      consentText: "I understand the repayment expectations, hardship options, and support contact channels before accepting these terms.",
    };
  }

  return { ok: true, data: application };
}

export async function acceptLoanTermsCommand(
  input: FormData | Record<string, unknown> | unknown,
  currentStudentId = "student-demo",
): Promise<ActionResult<SupportApplication>> {
  const value = normalizeRecord(input);
  const parsed = loanAcceptanceSchema.safeParse({
    applicationId: value.applicationId,
    acceptedAt: value.acceptedAt ?? new Date().toISOString(),
    acknowledgedTerms: value.acknowledgedTerms,
  } as LoanAcceptanceInput);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "You must accept the loan terms before moving forward.",
    };
  }

  const data = parsed.data;
  const store = getSupportApplicationStore();
  const application = store.find((entry) => entry.id === data.applicationId);

  if (!application) {
    return {
      ok: false,
      message: "The requested application could not be found.",
    };
  }

  if (application.studentId !== currentStudentId) {
    return {
      ok: false,
      message: "You may only accept your own loan terms.",
    };
  }

  if (application.status !== "APPROVED" || !application.loanTerms) {
    return {
      ok: false,
      message: "Loan terms can only be accepted after an approval decision.",
    };
  }

  application.status = "LOAN_ACCEPTED";
  application.updatedAt = new Date().toISOString();
  application.loanTerms.acceptedAt = data.acceptedAt;
  application.auditHistory.push(
    buildAuditEntry(currentStudentId, "STUDENT", "LOAN_ACCEPTED", "Loan terms accepted.", "APPROVED", "LOAN_ACCEPTED"),
  );

  return { ok: true, data: application };
}

export async function submitSupportApplication(formData: FormData): Promise<void> {
  const result = await submitSupportApplicationCommand(formData, "student-demo");

  if (!result.ok) {
    throw new Error(result.message);
  }
}

export async function reviewSupportApplication(formData: FormData): Promise<void> {
  const result = await reviewSupportApplicationCommand(formData, "reviewer-demo");

  if (!result.ok) {
    throw new Error(result.message);
  }
}

export async function acceptLoanTerms(formData: FormData): Promise<void> {
  const result = await acceptLoanTermsCommand(formData, "student-demo");

  if (!result.ok) {
    throw new Error(result.message);
  }
}
