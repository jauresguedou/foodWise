export const paymentStatuses = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
  "EXPIRED",
  "DISPUTED",
  "DISPUTE_WON",
  "DISPUTE_LOST",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentState = {
  id: string;
  orderId: string;
  currency: string;
  amountMinor: number;
  refundedMinor: number;
  status: PaymentStatus;
};

export type VerifiedPaymentEvent = {
  providerEventId: string;
  provider: "stripe";
  signatureVerified: true;
  targetStatus: Exclude<PaymentStatus, "PENDING">;
  occurredAt: Date;
  correlationId: string;
  reason: string;
  refundAmountMinor?: number;
};

export type PaymentAuditEntry = {
  paymentId: string;
  actor: string;
  providerEventId: string;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  reason: string;
  occurredAt: Date;
  correlationId: string;
};

export type PaymentTransition = {
  payment: PaymentState;
  audit: PaymentAuditEntry;
};

const allowedTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ["SUCCEEDED", "FAILED", "CANCELED", "EXPIRED", "DISPUTED", "DISPUTE_WON", "DISPUTE_LOST", "PARTIALLY_REFUNDED", "REFUNDED"],
  SUCCEEDED: ["DISPUTED", "DISPUTE_LOST", "DISPUTE_WON", "PARTIALLY_REFUNDED", "REFUNDED"],
  FAILED: ["SUCCEEDED", "DISPUTED", "DISPUTE_LOST", "REFUNDED"],
  CANCELED: ["SUCCEEDED", "DISPUTED", "DISPUTE_LOST", "REFUNDED"],
  EXPIRED: ["SUCCEEDED", "DISPUTED", "DISPUTE_LOST", "REFUNDED"],
  DISPUTED: ["SUCCEEDED", "DISPUTE_WON", "DISPUTE_LOST", "PARTIALLY_REFUNDED", "REFUNDED"],
  DISPUTE_WON: ["DISPUTED", "PARTIALLY_REFUNDED", "REFUNDED"],
  DISPUTE_LOST: ["DISPUTED", "PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["DISPUTED", "DISPUTE_WON", "DISPUTE_LOST", "PARTIALLY_REFUNDED", "REFUNDED"],
  REFUNDED: ["DISPUTED", "DISPUTE_LOST"],
};

export function transitionPayment(
  current: PaymentState,
  event: VerifiedPaymentEvent,
): PaymentTransition {
  if (event.signatureVerified !== true || event.provider !== "stripe") {
    throw new Error("Payment transitions require a verified Stripe event.");
  }
  if (!event.providerEventId || !event.correlationId || !event.reason.trim()) {
    throw new Error("Payment events require an ID, reason, and correlation ID.");
  }
  if (!allowedTransitions[current.status].includes(event.targetStatus)) {
    throw new Error(`Invalid payment transition: ${current.status} to ${event.targetStatus}.`);
  }

  let refundedMinor = current.refundedMinor;
  if (event.targetStatus === "PARTIALLY_REFUNDED" || event.targetStatus === "REFUNDED") {
    const refundAmountMinor = event.refundAmountMinor;
    if (!Number.isSafeInteger(refundAmountMinor) || refundAmountMinor === undefined || refundAmountMinor <= 0) {
      throw new RangeError("Refund amount must be a positive integer in minor units.");
    }
    refundedMinor += refundAmountMinor;
    if (!Number.isSafeInteger(refundedMinor) || refundedMinor > current.amountMinor) {
      throw new RangeError("Refunds cannot exceed the original payment amount.");
    }
    if (event.targetStatus === "REFUNDED" && refundedMinor !== current.amountMinor) {
      throw new RangeError("A refunded payment must refund its full amount.");
    }
    if (event.targetStatus === "PARTIALLY_REFUNDED" && refundedMinor === current.amountMinor) {
      throw new RangeError("A full refund must use the REFUNDED status.");
    }
  } else if (event.refundAmountMinor !== undefined) {
    throw new RangeError("Only refund events may include a refund amount.");
  }

  return {
    payment: { ...current, status: event.targetStatus, refundedMinor },
    audit: {
      paymentId: current.id,
      actor: `stripe:${event.providerEventId}`,
      providerEventId: event.providerEventId,
      fromStatus: current.status,
      toStatus: event.targetStatus,
      reason: event.reason,
      occurredAt: event.occurredAt,
      correlationId: event.correlationId,
    },
  };
}