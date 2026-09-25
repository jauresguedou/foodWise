import { createHash } from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../../../../src/db/client";
import { getStripeClient } from "../../../../src/lib/stripe";
import { transitionPayment, type PaymentStatus, type VerifiedPaymentEvent } from "../../../../src/domain/payment-state";

export const runtime = "nodejs";

type MappedEvent = {
  targetStatus?: Exclude<PaymentStatus, "PENDING">;
  sessionId?: string;
  paymentIntentId?: string;
  paymentId?: string;
  disputeId?: string;
  providerCurrency?: string;
  providerAmountMinor?: number;
  captured?: boolean;
  cumulativeRefundMinor?: number;
  disputeAmountMinor?: number;
  reason: string;
};

function providerObjectId(value: string | { id: string } | null): string | undefined {
  return typeof value === "string" ? value : value?.id;
}

function mapStripeEvent(event: Stripe.Event): MappedEvent {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      return {
        targetStatus: session.payment_status === "paid" ? "SUCCEEDED" : undefined,
        sessionId: session.id,
        paymentIntentId: providerObjectId(session.payment_intent),
        paymentId: session.metadata?.paymentId,
        providerCurrency: session.currency ?? undefined,
        providerAmountMinor: session.amount_total ?? undefined,
        captured: session.payment_status === "paid",
        reason: "Stripe Checkout session completed.",
      };
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      return {
        targetStatus: "SUCCEEDED",
        sessionId: session.id,
        paymentIntentId: providerObjectId(session.payment_intent),
        paymentId: session.metadata?.paymentId,
        providerCurrency: session.currency ?? undefined,
        providerAmountMinor: session.amount_total ?? undefined,
        captured: session.payment_status === "paid",
        reason: "Stripe confirmed the delayed Checkout payment.",
      };
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      return {
        targetStatus: "FAILED",
        sessionId: session.id,
        paymentIntentId: providerObjectId(session.payment_intent),
        paymentId: session.metadata?.paymentId,
        providerCurrency: session.currency ?? undefined,
        providerAmountMinor: session.amount_total ?? undefined,
        reason: "Stripe reported that the delayed Checkout payment failed.",
      };
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      return {
        targetStatus: "EXPIRED",
        sessionId: session.id,
        paymentIntentId: providerObjectId(session.payment_intent),
        paymentId: session.metadata?.paymentId,
        providerCurrency: session.currency ?? undefined,
        providerAmountMinor: session.amount_total ?? undefined,
        reason: "Stripe Checkout session expired.",
      };
    }
    case "payment_intent.succeeded":
      return {
        targetStatus: "SUCCEEDED",
        paymentIntentId: event.data.object.id,
        paymentId: event.data.object.metadata.paymentId,
        providerCurrency: event.data.object.currency,
        providerAmountMinor: event.data.object.amount_received,
        captured: event.data.object.amount_received > 0,
        reason: "Stripe confirmed the payment intent.",
      };
    case "payment_intent.payment_failed":
      return {
        targetStatus: "FAILED",
        paymentIntentId: event.data.object.id,
        paymentId: event.data.object.metadata.paymentId,
        providerCurrency: event.data.object.currency,
        providerAmountMinor: event.data.object.amount,
        reason: "Stripe reported a failed payment intent.",
      };
    case "payment_intent.canceled":
      return {
        targetStatus: "CANCELED",
        paymentIntentId: event.data.object.id,
        paymentId: event.data.object.metadata.paymentId,
        providerCurrency: event.data.object.currency,
        providerAmountMinor: event.data.object.amount,
        reason: "Stripe canceled the payment intent.",
      };
    case "charge.refunded":
      return {
        paymentIntentId: providerObjectId(event.data.object.payment_intent),
        providerCurrency: event.data.object.currency,
        providerAmountMinor: event.data.object.amount,
        captured: event.data.object.paid && event.data.object.captured,
        cumulativeRefundMinor: event.data.object.amount_refunded,
        reason: "Stripe reported a refund update.",
      };
    case "charge.dispute.created":
      return {
        targetStatus: "DISPUTED",
        disputeId: event.data.object.id,
        paymentIntentId: providerObjectId(event.data.object.payment_intent),
        providerCurrency: event.data.object.currency,
        disputeAmountMinor: event.data.object.amount,
        reason: "A payment dispute was opened with Stripe.",
      };
    case "charge.dispute.closed":
      return {
        targetStatus: event.data.object.status === "won" ? "DISPUTE_WON" : "DISPUTE_LOST",
        disputeId: event.data.object.id,
        paymentIntentId: providerObjectId(event.data.object.payment_intent),
        providerCurrency: event.data.object.currency,
        disputeAmountMinor: event.data.object.amount,
        reason: `Stripe closed the dispute as ${event.data.object.status}.`,
      };
    default:
      return { reason: `Stripe event ${event.type} does not change payment status.` };
  }
}

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return Response.json({ error: "Webhook configuration is unavailable." }, { status: 503 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const now = new Date();
  const leaseExpiredAt = new Date(now.getTime() - 5 * 60 * 1000);
  try {
    await prisma.webhookEvent.create({
      data: { providerEventId: event.id, type: event.type, payloadHash },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      const priorEvent = await prisma.webhookEvent.findUnique({ where: { providerEventId: event.id } });
      const leaseExpired = priorEvent?.status === "PROCESSING"
        && (!priorEvent.processingStartedAt || priorEvent.processingStartedAt < leaseExpiredAt);
      if (priorEvent?.status === "PROCESSING" && !leaseExpired) {
        return Response.json({ error: "Webhook event is still being processed." }, { status: 503 });
      }
      if (!priorEvent || priorEvent.status === "PROCESSED") {
        return Response.json({ received: true, duplicate: true });
      }
    } else {
      return Response.json({ error: "Webhook event could not be persisted." }, { status: 500 });
    }
  }

  const claim = await prisma.webhookEvent.updateMany({
    where: {
      providerEventId: event.id,
      OR: [
        { status: { in: ["RECEIVED", "FAILED"] } },
        { status: "PROCESSING", processingStartedAt: { lt: leaseExpiredAt } },
        { status: "PROCESSING", processingStartedAt: null, receivedAt: { lt: leaseExpiredAt } },
      ],
    },
    data: { status: "PROCESSING", processingStartedAt: now, lastError: null },
  });
  if (claim.count !== 1) {
    const priorEvent = await prisma.webhookEvent.findUnique({ where: { providerEventId: event.id } });
    if (priorEvent?.status === "PROCESSED") return Response.json({ received: true, duplicate: true });
    return Response.json({ error: "Webhook event is still being processed." }, { status: 503 });
  }

  const mapped = mapStripeEvent(event);
  try {
    await prisma.$transaction(async (transaction) => {
      const storedEvent = await transaction.webhookEvent.findUniqueOrThrow({
        where: { providerEventId: event.id },
      });
      const payment = await transaction.payment.findFirst({
        where: {
          OR: [
            ...(mapped.paymentId ? [{ id: mapped.paymentId }] : []),
            ...(mapped.sessionId ? [{ providerSessionId: mapped.sessionId }] : []),
            ...(mapped.paymentIntentId ? [{ providerPaymentIntentId: mapped.paymentIntentId }] : []),
          ],
        },
        include: { order: { include: { items: true } } },
      });

      if (payment && mapped.paymentIntentId && !payment.providerPaymentIntentId) {
        await transaction.payment.update({
          where: { id: payment.id },
          data: { providerPaymentIntentId: mapped.paymentIntentId },
        });
      }
      if (payment && mapped.providerCurrency && mapped.providerCurrency.toUpperCase() !== payment.currency) {
        throw new Error("Provider currency does not match the order currency.");
      }
      if (payment && mapped.providerAmountMinor !== undefined
        && mapped.providerAmountMinor !== payment.amountMinor
        && (mapped.targetStatus === "SUCCEEDED" || mapped.captured)) {
        throw new Error("Provider amount does not match the order total.");
      }

      let targetStatus = mapped.targetStatus;
      let refundAmountMinor: number | undefined;
      if (payment && mapped.cumulativeRefundMinor !== undefined) {
        refundAmountMinor = mapped.cumulativeRefundMinor - payment.refundedMinor;
        if (refundAmountMinor > 0) {
          targetStatus = mapped.cumulativeRefundMinor >= payment.amountMinor ? "REFUNDED" : "PARTIALLY_REFUNDED";
        }
      }

      const eventOccurredAt = new Date(event.created * 1000);
      const eventIsStale = payment?.providerEventCreatedAt !== null
        && payment?.providerEventCreatedAt !== undefined
        && eventOccurredAt < payment.providerEventCreatedAt;

      if (payment && (targetStatus === "SUCCEEDED" || mapped.captured)) {
        const existingCapture = await transaction.paymentLedgerEntry.findUnique({
          where: { idempotencyKey: `capture:${payment.id}` },
        });
        if (!existingCapture) {
          await transaction.paymentLedgerEntry.create({
            data: {
              idempotencyKey: `capture:${payment.id}`,
              sourceProviderEventId: event.id,
              paymentId: payment.id,
              orderId: payment.orderId,
              entryType: "CAPTURE",
              amountMinor: payment.amountMinor,
              currency: payment.currency,
              actor: `stripe:${event.id}`,
              occurredAt: eventOccurredAt,
              correlationId: payment.order.correlationId,
            },
          });
        }
      }
      if (payment && mapped.captured && payment.order.status === "PAYMENT_PENDING") {
        await transaction.order.update({
          where: { id: payment.orderId },
          data: { status: "PLACED", placedAt: eventOccurredAt },
        });
        await transaction.auditEvent.create({
          data: {
            actor: `stripe:${event.id}`,
            action: "ORDER_PLACED",
            entityType: "ORDER",
            entityId: payment.orderId,
            reason: "Stripe confirmed the captured payment for this order.",
            occurredAt: eventOccurredAt,
            correlationId: payment.order.correlationId,
            providerEventId: event.id,
            orderId: payment.orderId,
            paymentId: payment.id,
          },
        });
      }
      if (payment && mapped.captured) {
        await transaction.orderItem.updateMany({
          where: { orderId: payment.orderId, inventoryReserved: true },
          data: { inventoryReserved: false },
        });
      }

      const refundUpdate = refundAmountMinor !== undefined
        && refundAmountMinor > 0
        && (targetStatus === "PARTIALLY_REFUNDED" || targetStatus === "REFUNDED");
      if (payment && targetStatus && !eventIsStale && (targetStatus !== payment.status || refundUpdate)) {
        const providerEvent: VerifiedPaymentEvent = {
          providerEventId: event.id,
          provider: "stripe",
          signatureVerified: true,
          targetStatus,
          occurredAt: eventOccurredAt,
          correlationId: payment.order.correlationId,
          reason: mapped.reason,
          ...(refundAmountMinor !== undefined ? { refundAmountMinor } : {}),
        };
        const transition = transitionPayment({
          id: payment.id,
          orderId: payment.orderId,
          currency: payment.currency,
          amountMinor: payment.amountMinor,
          refundedMinor: payment.refundedMinor,
          status: payment.status,
        }, providerEvent);
        await transaction.payment.update({
          where: { id: payment.id },
          data: {
            status: transition.payment.status,
            refundedMinor: transition.payment.refundedMinor,
            providerEventCreatedAt: eventOccurredAt,
          },
        });
        await transaction.auditEvent.create({
          data: {
            actor: transition.audit.actor,
            action: `PAYMENT_${targetStatus}`,
            entityType: "PAYMENT",
            entityId: payment.id,
            reason: transition.audit.reason,
            occurredAt: transition.audit.occurredAt,
            correlationId: transition.audit.correlationId,
            providerEventId: event.id,
            orderId: payment.orderId,
            paymentId: payment.id,
          },
        });

        if (["CANCELED", "EXPIRED"].includes(targetStatus)) {
          const canceledOrder = await transaction.order.updateMany({
            where: { id: payment.orderId, status: "PAYMENT_PENDING" },
            data: { status: "CANCELLED" },
          });
          if (canceledOrder.count === 1) {
            for (const item of payment.order.items) {
              if (!item.inventoryReserved) continue;
              await transaction.menuItem.update({
                where: { id: item.menuItemId },
                data: { inventoryQuantity: { increment: item.quantity } },
              });
              await transaction.orderItem.update({
                where: { id: item.id },
                data: { inventoryReserved: false },
              });
            }
            await transaction.auditEvent.create({
              data: {
                actor: `stripe:${event.id}`,
                action: "ORDER_CANCELLED",
                entityType: "ORDER",
                entityId: payment.orderId,
                reason: `Stripe reported payment status ${targetStatus}.`,
                occurredAt: eventOccurredAt,
                correlationId: payment.order.correlationId,
                providerEventId: event.id,
                orderId: payment.orderId,
                paymentId: payment.id,
              },
            });
          }
        }

        if (targetStatus === "PARTIALLY_REFUNDED" || targetStatus === "REFUNDED") {
          await transaction.paymentLedgerEntry.create({
            data: {
              idempotencyKey: `refund:${event.id}`,
              sourceProviderEventId: event.id,
              paymentId: payment.id,
              orderId: payment.orderId,
              entryType: "REFUND",
              amountMinor: refundAmountMinor ?? 0,
              currency: payment.currency,
              actor: `stripe:${event.id}`,
              occurredAt: eventOccurredAt,
              correlationId: payment.order.correlationId,
            },
          });
        }

      } else if (payment && targetStatus === payment.status && !eventIsStale) {
        await transaction.payment.update({
          where: { id: payment.id },
          data: { providerEventCreatedAt: eventOccurredAt },
        });
      }

      if (payment && (targetStatus === "DISPUTED" || targetStatus === "DISPUTE_WON" || targetStatus === "DISPUTE_LOST")) {
        const disputeKey = mapped.disputeId ?? event.id;
        const debitKey = `dispute-debit:${payment.id}:${disputeKey}`;
        const existingDebit = await transaction.paymentLedgerEntry.findUnique({ where: { idempotencyKey: debitKey } });
        if (!existingDebit) {
          await transaction.paymentLedgerEntry.create({
            data: {
              idempotencyKey: debitKey,
              sourceProviderEventId: event.id,
              paymentId: payment.id,
              orderId: payment.orderId,
              entryType: "DISPUTE_DEBIT",
              amountMinor: mapped.disputeAmountMinor ?? payment.amountMinor,
              currency: payment.currency,
              actor: `stripe:${event.id}`,
              occurredAt: eventOccurredAt,
              correlationId: payment.order.correlationId,
            },
          });
        }
        if (targetStatus === "DISPUTE_WON") {
          const creditKey = `dispute-credit:${payment.id}:${disputeKey}`;
          const existingCredit = await transaction.paymentLedgerEntry.findUnique({ where: { idempotencyKey: creditKey } });
          if (!existingCredit) {
            await transaction.paymentLedgerEntry.create({
              data: {
                idempotencyKey: creditKey,
                sourceProviderEventId: event.id,
                paymentId: payment.id,
                orderId: payment.orderId,
                entryType: "DISPUTE_CREDIT",
                amountMinor: mapped.disputeAmountMinor ?? payment.amountMinor,
                currency: payment.currency,
                actor: `stripe:${event.id}`,
                occurredAt: eventOccurredAt,
                correlationId: payment.order.correlationId,
              },
            });
          }
        }
      }

      await transaction.webhookEvent.update({
        where: { id: storedEvent.id },
        data: { status: "PROCESSED", processedAt: new Date(), paymentId: payment?.id },
      });
    });
  } catch {
    await prisma.webhookEvent.update({
      where: { providerEventId: event.id },
      data: { status: "FAILED", lastError: "Provider event processing failed." },
    });
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}