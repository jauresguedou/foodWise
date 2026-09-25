import { describe, expect, it } from "vitest";
import { transitionPayment, type PaymentState, type VerifiedPaymentEvent } from "../../src/domain/payment-state";

const payment: PaymentState = {
  id: "pay_1",
  orderId: "order_1",
  currency: "USD",
  amountMinor: 2500,
  refundedMinor: 0,
  status: "PENDING",
};

function providerEvent(targetStatus: VerifiedPaymentEvent["targetStatus"]): VerifiedPaymentEvent {
  return {
    providerEventId: "evt_1",
    provider: "stripe",
    signatureVerified: true,
    targetStatus,
    occurredAt: new Date("2026-09-25T12:00:00.000Z"),
    correlationId: "req_1",
    reason: `Stripe event mapped to ${targetStatus}`,
  };
}

describe("payment state transitions", () => {
  it("records successful payment with provider actor and correlation audit", () => {
    const result = transitionPayment(payment, providerEvent("SUCCEEDED"));
    expect(result.payment.status).toBe("SUCCEEDED");
    expect(result.audit).toMatchObject({
      actor: "stripe:evt_1",
      fromStatus: "PENDING",
      toStatus: "SUCCEEDED",
      correlationId: "req_1",
    });
  });

  it("rejects browser or unsigned events", () => {
    expect(() => transitionPayment(payment, {
      ...providerEvent("SUCCEEDED"),
      signatureVerified: false as true,
    })).toThrow("Payment transitions require a verified Stripe event.");
  });

  it("rejects illegal transitions", () => {
    expect(() => transitionPayment({ ...payment, status: "REFUNDED" }, providerEvent("SUCCEEDED")))
      .toThrow("Invalid payment transition");
  });

  it("represents failure, cancellation, expiration, and dispute outcomes separately", () => {
    expect(transitionPayment(payment, providerEvent("FAILED")).payment.status).toBe("FAILED");
    expect(transitionPayment(payment, providerEvent("CANCELED")).payment.status).toBe("CANCELED");
    expect(transitionPayment(payment, providerEvent("EXPIRED")).payment.status).toBe("EXPIRED");
    expect(transitionPayment(payment, providerEvent("DISPUTED")).payment.status).toBe("DISPUTED");
    expect(transitionPayment({ ...payment, status: "DISPUTED" }, providerEvent("DISPUTE_LOST")).payment.status)
      .toBe("DISPUTE_LOST");
  });

  it("tracks partial and full refunds without exceeding the captured amount", () => {
    const succeeded = { ...payment, status: "SUCCEEDED" as const };
    const partial = transitionPayment(succeeded, {
      ...providerEvent("PARTIALLY_REFUNDED"),
      refundAmountMinor: 500,
    });
    expect(partial.payment.refundedMinor).toBe(500);
    const secondPartial = transitionPayment(partial.payment, {
      ...providerEvent("PARTIALLY_REFUNDED"),
      providerEventId: "evt_2",
      refundAmountMinor: 250,
    });
    expect(secondPartial.payment).toMatchObject({ status: "PARTIALLY_REFUNDED", refundedMinor: 750 });
    const full = transitionPayment(secondPartial.payment, {
      ...providerEvent("REFUNDED"),
      providerEventId: "evt_3",
      refundAmountMinor: 1750,
    });
    expect(full.payment).toMatchObject({ status: "REFUNDED", refundedMinor: 2500 });
    expect(() => transitionPayment(succeeded, {
      ...providerEvent("REFUNDED"),
      refundAmountMinor: 2501,
    })).toThrow("Refunds cannot exceed the original payment amount.");
  });

  it("requires an exact refund amount for a full refund", () => {
    expect(() => transitionPayment({ ...payment, status: "SUCCEEDED" }, {
      ...providerEvent("REFUNDED"),
      refundAmountMinor: 100,
    })).toThrow("A refunded payment must refund its full amount.");
  });
});