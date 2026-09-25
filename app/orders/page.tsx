import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../src/auth";
import { prisma } from "../../src/db/client";
import { formatMoney } from "../../src/lib/money";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const orders = await prisma.order.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalMinor: true,
      currency: true,
      createdAt: true,
      payment: { select: { status: true } },
      store: { select: { name: true } },
    },
  });

  return (
    <main className="checkout-page">
      <p className="eyebrow">Your account</p>
      <h1>Your orders</h1>
      {orders.length === 0 ? <p>No orders yet.</p> : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`}>
                <span><strong>{order.store.name}</strong><small>{order.createdAt.toLocaleString()}</small></span>
                <span>{formatMoney(order.totalMinor, order.currency)}<small>{order.payment?.status ?? "Payment unavailable"}</small></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link className="back-link" href="/#discover">Find another meal</Link>
    </main>
  );
}