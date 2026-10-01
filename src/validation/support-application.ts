import { z } from "zod";

export const supportTypeSchema = z.enum(["MEAL_SUPPORT", "EMERGENCY_LOAN"]);
export const supportStatusSchema = z.enum([
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "DECLINED",
  "REFERRED",
  "LOAN_ACCEPTED",
]);
export const reviewerDecisionSchema = z.enum(["APPROVED", "DECLINED", "REFERRED"]);

export const supportApplicationSchema = z
  .object({
    studentId: z.string().trim().min(1, "Student id is required."),
    supportType: supportTypeSchema,
    needsSummary: z.string().trim().min(20, "Please provide a bit more detail about the food need."),
    consentGiven: z.preprocess((value) => {
      if (typeof value === "string") {
        return value === "true" || value === "1";
      }

      return Boolean(value);
    }, z.boolean().refine((value) => value === true, "Consent is required before submission.")),
    requestedAmountMinor: z.number().int().nonnegative().optional().default(0),
    period: z.string().trim().min(1, "Support period is required."),
  })
  .superRefine((value, ctx) => {
    if (value.supportType === "EMERGENCY_LOAN" && value.requestedAmountMinor <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestedAmountMinor"],
        message: "Loan requests need a positive requested amount.",
      });
    }
  });

export const reviewSupportApplicationSchema = z.object({
  applicationId: z.string().trim().min(1, "Application id is required."),
  decision: reviewerDecisionSchema,
  reason: z.string().trim().min(8, "Please add a clear reviewer reason."),
  reviewerRole: z.string().trim().min(1, "Reviewer role is required."),
});

export const loanAcceptanceSchema = z.object({
  applicationId: z.string().trim().min(1, "Application id is required."),
  acceptedAt: z.string().trim().min(1, "Accepted timestamp is required."),
  acknowledgedTerms: z.preprocess((value) => {
    if (typeof value === "string") {
      return value === "true" || value === "1";
    }

    return Boolean(value);
  }, z.boolean().refine((value) => value === true, "You must acknowledge the loan terms to accept them.")),
});

export type SupportApplicationInput = z.infer<typeof supportApplicationSchema>;
export type ReviewSupportApplicationInput = z.infer<typeof reviewSupportApplicationSchema>;
export type LoanAcceptanceInput = z.infer<typeof loanAcceptanceSchema>;
