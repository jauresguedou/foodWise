import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

const mocks = vi.hoisted(() => ({
  createEvent: vi.fn(),
  findEvent: vi.fn(),
  claimEvent: vi.fn(),
  updateEvent: vi.fn(),
  processEvent: vi.fn(),
  findPayment: vi.fn(),
  finishEvent: vi.fn(),
}));

vi.mock("../../src/db/client", () => ({
  prisma: {
    webhookEvent: {
      create: mocks.createEvent,
      findUnique: mocks.findEvent,
      updateMany: mocks.claimEvent,
      update: mocks.updateEvent,
    },
    $transaction: mocks.processEvent,
  },
}));

import { POST } from "../../app/api/webhooks/stripe/route";

const webhookSecret = "whsec_foodwise_test_secret";
const stripe = new Stripe("sk_test_foodwise_unit_test");

function signedRequest(eventId: string): Request {
  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    api_version: Stripe.API_VERSION,
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "cus_test_1", object: "customer" } },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.created",
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

describe("Stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_foodwise_unit_test";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    mocks.createEvent.mockResolvedValue({ id: "webhook_row_1" });
    mocks.findEvent.mockResolvedValue({ id: "webhook_row_1", status: "PROCESSED", processingStartedAt: null });
    mocks.claimEvent.mockResolvedValue({ count: 1 });
    mocks.updateEvent.mockResolvedValue({});
    mocks.processEvent.mockImplementation(async (callback: (transaction: unknown) => Promise<unknown>) => callback({
      webhookEvent: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "webhook_row_1" }), update: mocks.finishEvent },
      payment: { findFirst: mocks.findPayment },
    }));
    mocks.findPayment.mockResolvedValue(null);
    mocks.finishEvent.mockResolvedValue({});
  });

  it("rejects an invalid signature before persisting or processing", async () => {
    const response = await POST(new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "invalid" },
      body: "{}",
    }));
    expect(response.status).toBe(400);
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.processEvent).not.toHaveBeenCalled();
  });

  it("persists a verified event before processing and deduplicates its replay", async () => {
    const first = await POST(signedRequest("evt_foodwise_replay"));
    expect(first.status).toBe(200);
    expect(mocks.createEvent).toHaveBeenCalledOnce();
    expect(mocks.processEvent).toHaveBeenCalledOnce();
    expect(mocks.createEvent.mock.invocationCallOrder[0]).toBeLessThan(mocks.processEvent.mock.invocationCallOrder[0]);

    const duplicateError = Object.assign(new Error("Unique event"), { code: "P2002" });
    mocks.createEvent.mockRejectedValueOnce(duplicateError);
    mocks.findEvent.mockResolvedValueOnce({ id: "webhook_row_1", status: "PROCESSED", processingStartedAt: null });
    const replay = await POST(signedRequest("evt_foodwise_replay"));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ received: true, duplicate: true });
    expect(mocks.processEvent).toHaveBeenCalledOnce();
  });

  it("asks Stripe to retry an event with an active processing lease", async () => {
    const duplicateError = Object.assign(new Error("Unique event"), { code: "P2002" });
    mocks.createEvent.mockRejectedValueOnce(duplicateError);
    mocks.findEvent.mockResolvedValueOnce({
      id: "webhook_row_1",
      status: "PROCESSING",
      processingStartedAt: new Date(),
    });
    const response = await POST(signedRequest("evt_foodwise_in_progress"));
    expect(response.status).toBe(503);
    expect(mocks.processEvent).not.toHaveBeenCalled();
  });
});