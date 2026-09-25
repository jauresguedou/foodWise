"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireVerifiedStudent } from "../../auth/session";
import { prisma } from "../../db/client";
import { calculateOrderQuote } from "../../lib/money";
import { getAppUrl, getStripeClient } from "../../lib/stripe";
import { quoteFingerprint } from "../../lib/quote-fingerprint";
import { getCartView, readCart } from "../cart";

export type CheckoutActionState = {
  kind: "idle" | "error" | "changed" | "redirect";
  message: string;
  url?: string;
};

const initialState: CheckoutActionState = { kind: "idle", message: "" };
const checkoutSchema = z.object({ quoteFingerprint: z.string().regex(/^[a-f0-9]{64}$/) });

export async function createCheckoutSession(
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const student = await requireVerifiedStudent();
  const parsed = checkoutSchema.safeParse({ quoteFingerprint: formData.get("quoteFingerprint") });
  if (!parsed.success) return { kind: "error", message: "Refresh checkout and review your total." };

  let stripe: ReturnType<typeof getStripeClient>;
  let appUrl: URL;
  try {
    stripe = getStripeClient();
    appUrl = getAppUrl();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment configuration is unavailable.";
    return { kind: "error", message };
  }

  const cart = await readCart();
  if (!cart || cart.lines.length === 0) return { kind: "error", message: "Your cart is empty." };

  let orderId: string;
  let paymentId: string;
  let correlationId: string;
  let currency: string;
  let lineItems: Array<{ quantity: number; unitPriceMinor: number; name: string }>;
  const existing = await prisma.order.findUnique({
    where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: cart.idempotencyKey } },
    include: { payment: true, items: true },
  });

  if (existing) {
    if (existing.status !== "PAYMENT_PENDING") {
      return { kind: "redirect", message: "Opening your order status.", url: `${appUrl.origin}/orders/${existing.id}` };
    }
    if (!existing.payment) return { kind: "error", message: "The payment record is unavailable. Contact support." };
    if (existing.stripeSessionId) {
      try {
        const priorSession = await stripe.checkout.sessions.retrieve(existing.stripeSessionId);
        if (priorSession.status === "open" && priorSession.url) {
          return { kind: "redirect", message: "Returning to your secure payment session.", url: priorSession.url };
        }
        if (priorSession.status === "complete") {
          return { kind: "redirect", message: "Payment is being verified.", url: `${appUrl.origin}/orders/${existing.id}` };
        }
        return { kind: "error", message: "This payment session expired. Add a meal again to safely retry." };
      } catch {
        return { kind: "error", message: "We could not check the existing payment session. Please try again." };
      }
    }
    orderId = existing.id;
    paymentId = existing.payment.id;
    correlationId = existing.correlationId;
    currency = existing.currency;
    lineItems = existing.items.map((item) => ({
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      name: item.nameSnapshot,
    }));
  } else {
    const cartView = await getCartView(student.isVerifiedStudent);
    if (!cartView || !cartView.quote || cartView.hasUnavailableItems) {
      return { kind: "error", message: "Your cart has unavailable meals. Update it before paying." };
    }
    if (cartView.issues.length > 0 || quoteFingerprint(cartView.cart, cartView.quote) !== parsed.data.quoteFingerprint) {
      return { kind: "changed", message: "Your total changed. Review the updated amount and confirm again." };
    }

    correlationId = randomUUID();
    try {
      const order = await prisma.$transaction(async (transaction) => {
        const store = await transaction.store.findFirst({
          where: { id: cartView.store.id, status: "PUBLISHED", pickupAvailable: true },
          select: { currency: true },
        });
        const currentItems = await transaction.menuItem.findMany({
          where: {
            id: { in: cartView.cart.lines.map((line) => line.menuItemId) },
            storeId: cartView.store.id,
            isAvailable: true,
            archivedAt: null,
          },
          select: { id: true, name: true, priceMinor: true, studentPriceMinor: true, inventoryQuantity: true },
        });
        if (!store || currentItems.length !== cartView.cart.lines.length) throw new Error("CART_UNAVAILABLE");
        const menuItemById = new Map(currentItems.map((item) => [item.id, item]));
        const currentQuote = calculateOrderQuote(cartView.cart.lines.map((line) => {
          const item = menuItemById.get(line.menuItemId);
          if (!item) throw new Error("CART_UNAVAILABLE");
          return {
            menuItemId: item.id,
            quantity: line.quantity,
            priceMinor: item.priceMinor,
            studentPriceMinor: item.studentPriceMinor,
            currency: store.currency,
          };
        }), student.isVerifiedStudent);
        if (quoteFingerprint(cartView.cart, currentQuote) !== parsed.data.quoteFingerprint) {
          throw new Error("QUOTE_CHANGED");
        }

        for (const line of currentQuote.lines) {
          const item = menuItemById.get(line.menuItemId);
          if (item?.inventoryQuantity === null || !item) continue;
          const reservation = await transaction.menuItem.updateMany({
            where: {
              id: item.id,
              storeId: cartView.store.id,
              isAvailable: true,
              archivedAt: null,
              inventoryQuantity: { gte: line.quantity },
            },
            data: { inventoryQuantity: { decrement: line.quantity } },
          });
          if (reservation.count !== 1) throw new Error("CART_UNAVAILABLE");
        }

        const createdOrder = await transaction.order.create({
          data: {
            studentId: student.id,
            storeId: cartView.store.id,
            status: "PAYMENT_PENDING",
            subtotalMinor: currentQuote.subtotalMinor,
            discountMinor: currentQuote.discountMinor,
            feeMinor: currentQuote.feeMinor,
            totalMinor: currentQuote.totalMinor,
            currency: currentQuote.currency,
            idempotencyKey: cartView.cart.idempotencyKey,
            correlationId,
            items: {
              create: currentQuote.lines.map((line) => ({
                menuItemId: line.menuItemId,
                quantity: line.quantity,
                nameSnapshot: menuItemById.get(line.menuItemId)?.name ?? "Meal",
                basePriceMinor: line.priceMinor,
                unitPriceMinor: line.unitPriceMinor,
                lineTotalMinor: line.lineTotalMinor,
                inventoryReserved: menuItemById.get(line.menuItemId)?.inventoryQuantity !== null,
              })),
            },
            payment: {
              create: {
                amountMinor: currentQuote.totalMinor,
                currency: currentQuote.currency,
                status: "PENDING",
              },
            },
          },
          include: { payment: true, items: true },
        });
        await transaction.auditEvent.create({
          data: {
            actor: `student:${student.id}`,
            action: "CHECKOUT_CREATED",
            entityType: "ORDER",
            entityId: createdOrder.id,
            reason: "Student confirmed the current server-priced quote.",
            correlationId,
            orderId: createdOrder.id,
          },
        });
        return createdOrder;
      });
      if (!order.payment) return { kind: "error", message: "The payment record could not be created." };
      orderId = order.id;
      paymentId = order.payment.id;
      currency = order.currency;
      lineItems = order.items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        name: item.nameSnapshot,
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "QUOTE_CHANGED") {
        return { kind: "changed", message: "Your total changed. Review the updated amount and confirm again." };
      }
      if (error instanceof Error && error.message === "CART_UNAVAILABLE") {
        return { kind: "error", message: "A meal became unavailable. Remove it from your cart before paying." };
      }
      const duplicate = await prisma.order.findUnique({
        where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: cart.idempotencyKey } },
        include: { payment: true, items: true },
      });
      if (!duplicate || duplicate.status !== "PAYMENT_PENDING" || !duplicate.payment) {
        return { kind: "error", message: "We could not create your order. Please review your cart and try again." };
      }
      orderId = duplicate.id;
      paymentId = duplicate.payment.id;
      correlationId = duplicate.correlationId;
      currency = duplicate.currency;
      lineItems = duplicate.items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        name: item.nameSnapshot,
      }));
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      payment_method_types: ["card"],
      line_items: lineItems.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: line.unitPriceMinor,
          product_data: { name: line.name },
        },
      })),
      metadata: { orderId, paymentId, correlationId },
      payment_intent_data: { metadata: { orderId, paymentId, correlationId } },
      success_url: `${appUrl.origin}/orders/${orderId}?checkout=return`,
      cancel_url: `${appUrl.origin}/orders/${orderId}?checkout=canceled`,
    }, { idempotencyKey: `foodwise-order-${orderId}` });

    if (!session.url) return { kind: "error", message: "Stripe did not return a payment link. Please try again." };
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { stripeSessionId: session.id } }),
      prisma.payment.update({ where: { id: paymentId }, data: { providerSessionId: session.id } }),
    ]);
    return { kind: "redirect", message: "Opening secure Stripe Checkout.", url: session.url };
  } catch {
    await prisma.auditEvent.create({
      data: {
        actor: "system:stripe",
        action: "CHECKOUT_PROVIDER_ERROR",
        entityType: "ORDER",
        entityId: orderId,
        reason: "Stripe Checkout could not be created; the idempotent order remains pending for safe retry.",
        correlationId,
        orderId,
        paymentId,
      },
    });
    return { kind: "error", message: "Secure checkout is temporarily unavailable. Your order was not charged; retry safely." };
  }
}

export { initialState as initialCheckoutState };