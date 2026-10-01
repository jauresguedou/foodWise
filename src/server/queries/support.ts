export type SupportType = "MEAL_SUPPORT" | "EMERGENCY_LOAN";
export type SupportStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "DECLINED"
  | "REFERRED"
  | "LOAN_ACCEPTED";

export type AuditEntry = {
  actorId: string;
  actorRole: "STUDENT" | "REVIEWER";
  action: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DECLINED" | "REFERRED" | "LOAN_ACCEPTED";
  timestamp: string;
  reason: string;
  statusFrom: SupportStatus;
  statusTo: SupportStatus;
  correlationId: string;
};

export type LoanTerms = {
  principalMinor: number;
  feeMinor: number;
  repaymentPlan: string;
  dueDates: string[];
  acceptedAt: string | null;
  consentText: string;
};

export type SupportApplication = {
  id: string;
  studentId: string;
  supportType: SupportType;
  needsSummary: string;
  consentGiven: boolean;
  requestedAmountMinor: number;
  period: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  auditHistory: AuditEntry[];
  loanTerms?: LoanTerms;
};

const demoSupportApplications: SupportApplication[] = [
  {
    id: "sa-1001",
    studentId: "student-demo",
    supportType: "MEAL_SUPPORT",
    needsSummary: "I am balancing tuition and rent this week and need a few grocery supports for the upcoming weekend.",
    consentGiven: true,
    requestedAmountMinor: 2500,
    period: "2026-W1",
    status: "SUBMITTED",
    createdAt: "2026-01-10T12:00:00.000Z",
    updatedAt: "2026-01-10T12:00:00.000Z",
    auditHistory: [
      {
        actorId: "student-demo",
        actorRole: "STUDENT",
        action: "SUBMITTED",
        timestamp: "2026-01-10T12:00:00.000Z",
        reason: "Application submitted.",
        statusFrom: "SUBMITTED",
        statusTo: "SUBMITTED",
        correlationId: "corr-demo-1001",
      },
    ],
  },
];

export function listSupportApplications(studentId?: string, isReviewer = false): SupportApplication[] {
  if (isReviewer) {
    return demoSupportApplications;
  }

  if (!studentId) {
    return [];
  }

  return demoSupportApplications.filter((application) => application.studentId === studentId);
}

export function getSupportApplicationById(
  applicationId: string,
  studentId?: string,
  isReviewer = false,
): SupportApplication | null {
  const application = demoSupportApplications.find((entry) => entry.id === applicationId);

  if (!application) {
    return null;
  }

  if (isReviewer || application.studentId === studentId) {
    return application;
  }

  return null;
}

export function getSupportApplicationStore(): SupportApplication[] {
  return demoSupportApplications;
}
