import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateOrderQuote } from "../../src/lib/money";
import { quoteFingerprint } from "../../src/lib/quote-fingerprint";

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getCartView: vi.fn(),
  readCart: vi.fn(),
  stripeCreate: vi.fn(),
  stripeRetrieve: vi.fn(),
  orderFind: vi.fn(),
  orderCreate: vi.fn(),
  orderUpdate: vi.fn(),
  paymentUpdate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
  transactionStoreFind: vi.fn(),
  transactionMenuFind: vi.fn(),
  transactionMenuUpdateMany: vi.fn(),
  transactionOrderCreate: vi.fn(),
  transactionAuditCreate: vi.fn(),
}));

vi.mock("../../src/auth/session", () => ({ requireVerifiedStudent: mocks.requireStudent }));
vi.mock("../../src/server/cart", () => ({ getCartView: mocks.getCartView, readCart: mocks.readCart }));
vi.mock("../../src/db/client", () => ({
  prisma: {
    order: { findUnique: mocks.orderFind, create: mocks.orderCreate, update: mocks.orderUpdate },
    payment: { update: mocks.paymentUpdate },
    auditEvent: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("../../src/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: mocks.stripeCreate, retrieve: mocks.stripeRetrieve } },
  }),
  getAppUrl: () => new URL("http://localhost:3000"),
}));

import { createCheckoutSession } from "../../src/server/actions/orders";

const cart = {
  storeId: "store-1",
  idempotencyKey: "7f8064a0-d9f6-4f11-87f4-b6ced39cf1d2",
  lines: [{ menuItemId: "meal-1", quantity: 2, addedUnitPriceMinor: 900 }],
};
const quote = calculateOrderQuote([
  { menuItemId: "meal-1", quantity: 2, priceMinor: 1200, studentPriceMinor: 900, currency: "USD" },
], true);
const savedOrder = {
  id: "order-1",
  status: "PAYMENT_PENDING",
  stripeSessionId: null,
  correlationId: "request-1",
  currency: "USD",
  payment: { id: "payment-1" },
  items: [{ quantity: 2, unitPriceMinor: 900, nameSnapshot: "Test bowl" }],
};

function checkoutForm(): FormData {
  const formData = new FormData();
  formData.set("quoteFingerprint", quoteFingerprint(cart, quote));
  return formData;
}

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ id: "student-1", isVerifiedStudent: true });
    mocks.readCart.mockResolvedValue(cart);
    mocks.getCartView.mockResolvedValue({
      cart,
      store: { id: "store-1", name: "Test store", currency: "USD" },
      items: [{ menuItemId: "meal-1", name: "Test bowl", quantity: 2, isAvailable: true }],
      quote,
      fingerprint: quoteFingerprint(cart, quote),
      hasUnavailableItems: false,
      issues: [],
    });
    mocks.orderFind.mockResolvedValue(null);
    mocks.transactionStoreFind.mockResolvedValue({ currency: "USD" });
    mocks.transactionMenuFind.mockResolvedValue([{
      id: "meal-1",
      name: "Test bowl",
      priceMinor: 1200,
      studentPriceMinor: 900,
      inventoryQuantity: null,
    }]);
    mocks.transactionMenuUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionOrderCreate.mockResolvedValue(savedOrder);
    mocks.transactionAuditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (operation: unknown) => {
      const client = {
        store: { findFirst: mocks.transactionStoreFind },
        menuItem: { findMany: mocks.transactionMenuFind, updateMany: mocks.transactionMenuUpdateMany },
        order: { create: mocks.transactionOrderCreate },
        auditEvent: { create: mocks.transactionAuditCreate },
      };
      if (typeof operation === "function") {
        return (operation as (transaction: typeof client) => Promise<unknown>)(client);
      }
      return Promise.all(operation as Promise<unknown>[]);
    });
    mocks.orderUpdate.mockResolvedValue({});
    mocks.paymentUpdate.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.stripeCreate.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.test/session" });
    mocks.stripeRetrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.test/session" });
  });

  it("rejects unauthorized users before touching checkout data", async () => {
    mocks.requireStudent.mockRejectedValue(new Error("redirect"));
    await expect(createCheckoutSession({ kind: "idle", message: "" }, checkoutForm())).rejects.toThrow("redirect");
    expect(mocks.orderFind).not.toHaveBeenCalled();
  });

  it("rechecks server prices and refuses a changed quote before creating an order", async () => {
    mocks.transactionMenuFind.mockResolvedValue([{
      id: "meal-1",
      name: "Test bowl",
      priceMinor: 1500,
      studentPriceMinor: 1100,
      inventoryQuantity: null,
    }]);
    const result = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(result.kind).toBe("changed");
    expect(mocks.transactionOrderCreate).not.toHaveBeenCalled();
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });

  it("atomically reserves finite stock and rejects a sold-out race before order creation", async () => {
    mocks.transactionMenuFind.mockResolvedValue([{
      id: "meal-1",
      name: "Test bowl",
      priceMinor: 1200,
      studentPriceMinor: 900,
      inventoryQuantity: 4,
    }]);
    const result = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(result.kind).toBe("redirect");
    expect(mocks.transactionMenuUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "meal-1",
        storeId: "store-1",
        isAvailable: true,
        archivedAt: null,
        inventoryQuantity: { gte: 2 },
      },
      data: { inventoryQuantity: { decrement: 2 } },
    });
    expect(mocks.transactionOrderCreate.mock.calls[0][0].data.items.create[0].inventoryReserved).toBe(true);

    vi.clearAllMocks();
    mocks.requireStudent.mockResolvedValue({ id: "student-1", isVerifiedStudent: true });
    mocks.readCart.mockResolvedValue(cart);
    mocks.getCartView.mockResolvedValue({
      cart,
      store: { id: "store-1", name: "Test store", currency: "USD" },
      items: [{ menuItemId: "meal-1", name: "Test bowl", quantity: 2, isAvailable: true }],
      quote,
      fingerprint: quoteFingerprint(cart, quote),
      hasUnavailableItems: false,
      issues: [],
    });
    mocks.orderFind.mockResolvedValue(null);
    mocks.transactionStoreFind.mockResolvedValue({ currency: "USD" });
    mocks.transactionMenuFind.mockResolvedValue([{
      id: "meal-1",
      name: "Test bowl",
      priceMinor: 1200,
      studentPriceMinor: 900,
      inventoryQuantity: 1,
    }]);
    mocks.transactionMenuUpdateMany.mockResolvedValue({ count: 0 });
    const unavailable = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(unavailable.kind).toBe("error");
    expect(mocks.transactionOrderCreate).not.toHaveBeenCalled();
    expect(mocks.stripeCreate).not.toHaveBeenCalled();
  });

  it("creates one order and safely reuses its Stripe session on duplicate submission", async () => {
    const first = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(first.kind).toBe("redirect");
    expect(mocks.transactionOrderCreate).toHaveBeenCalledOnce();
    expect(mocks.stripeCreate).toHaveBeenCalledOnce();
    expect(mocks.stripeCreate.mock.calls[0][1]).toMatchObject({ idempotencyKey: "foodwise-order-order-1" });

    mocks.orderFind.mockResolvedValueOnce({ ...savedOrder, stripeSessionId: "cs_test_1" });
    const duplicate = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(duplicate.kind).toBe("redirect");
    expect(mocks.transactionOrderCreate).toHaveBeenCalledOnce();
    expect(mocks.stripeCreate).toHaveBeenCalledOnce();
    expect(mocks.stripeRetrieve).toHaveBeenCalledOnce();
  });

  it("retains its idempotent pending order after a provider failure and reuses it on retry", async () => {
    mocks.stripeCreate.mockRejectedValueOnce(new Error("provider timeout"));
    const failed = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(failed.kind).toBe("error");
    expect(mocks.transactionOrderCreate).toHaveBeenCalledOnce();

    mocks.orderFind.mockResolvedValueOnce(savedOrder);
    const retry = await createCheckoutSession({ kind: "idle", message: "" }, checkoutForm());
    expect(retry.kind).toBe("redirect");
    expect(mocks.transactionOrderCreate).toHaveBeenCalledOnce();
    expect(mocks.stripeCreate.mock.calls[0][1]).toMatchObject({ idempotencyKey: "foodwise-order-order-1" });
    expect(mocks.stripeCreate.mock.calls[1][1]).toMatchObject({ idempotencyKey: "foodwise-order-order-1" });
  });
});