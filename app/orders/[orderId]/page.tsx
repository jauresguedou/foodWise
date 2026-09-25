import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../src/auth";
import { prisma } from "../../../src/db/client";
import { formatMoney } from "../../../src/lib/money";

const paymentLabels: Record<string, string> = {
  PENDING: "Payment is processing. This page will update after provider confirmation.",
  SUCCEEDED: "Payment confirmed by Stripe.",
  FAILED: "Payment failed. No successful payment was confirmed.",
  CANCELED: "Payment was canceled.",
  EXPIRED: "The payment session expired before payment completed.",
  DISPUTED: "This payment is under dispute review.",
  DISPUTE_WON: "The payment dispute was resolved in your favor.",
  DISPUTE_LOST: "The payment dispute was resolved against this payment.",
  PARTIALLY_REFUNDED: "Part of this payment has been refunded.",
  REFUNDED: "This payment has been fully refunded.",
};

export default async function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, studentId: session.user.id },
    include: {
      store: { select: { name: true } },
      items: true,
      payment: true,
      auditEvents: { orderBy: { occurredAt: "desc" }, take: 20 },
    },
  });
  if (!order) notFound();

  return (
    <main className="checkout-page">
      <p className="eyebrow">Order status</p>
      <h1>{order.store.name}</h1>
      <section className="payment-status" aria-live="polite" aria-atomic="true">
        <h2>{order.payment ? paymentLabels[order.payment.status] : "Payment status unavailable."}</h2>
        <p>Order status: <strong>{order.status.replaceAll("_", " ")}</strong></p>
        {order.payment?.refundedMinor ? (
          <p>Refunded: {formatMoney(order.payment.refundedMinor, order.currency)} of {formatMoney(order.totalMinor, order.currency)}</p>
        ) : null}
        <p>Order total: <strong>{formatMoney(order.totalMinor, order.currency)}</strong></p>
      </section>
      <section className="order-receipt" aria-labelledby="receipt-heading">
        <h2 id="receipt-heading">Receipt</h2>
        <ul>
          {order.items.map((item) => (
            <li key={item.id}>
              <span>{item.quantity} × {item.nameSnapshot}</span>
              <span>{formatMoney(item.lineTotalMinor, order.currency)}</span>
            </li>
          ))}
        </ul>
        <p>Student savings: {formatMoney(order.discountMinor, order.currency)}</p>
        <p>Payment reference: <code>{order.id}</code></p>
      </section>
      <section className="audit-history" aria-labelledby="history-heading">
        <h2 id="history-heading">Order history</h2>
        <ol>
          {order.auditEvents.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.action.replaceAll("_", " ")}</strong>
              <time dateTime={entry.occurredAt.toISOString()}>{entry.occurredAt.toLocaleString()}</time>
              <p>{entry.reason}</p>
              <small>Reference: {entry.correlationId}</small>
            </li>
          ))}
        </ol>
      </section>
      <Link className="back-link" href="/orders">All orders</Link>
    </main>
  );
}