import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutConfirmation } from "../_components/checkout-confirmation";
import { CartActions } from "../_components/cart-controls";
import { requireVerifiedStudent } from "../../src/auth/session";
import { formatMoney } from "../../src/lib/money";
import { getCartView } from "../../src/server/cart";

export default async function CheckoutPage() {
  const student = await requireVerifiedStudent();
  const cart = await getCartView(student.isVerifiedStudent);
  if (!cart || !cart.quote) redirect("/cart");

  const pricesChanged = cart.issues.some((issue) => issue.includes("price changed"));
  const canPay = cart.issues.length === 0 && !cart.hasUnavailableItems && cart.fingerprint !== null;

  return (
    <main className="checkout-page">
      <p className="eyebrow">Secure checkout</p>
      <h1>Confirm your order</h1>
      <p className="cart-store">Pickup from {cart.store.name}</p>
      {cart.issues.length > 0 && (
        <div className="checkout-alert" role="alert">
          <h2>Order needs your attention</h2>
          {cart.issues.map((issue) => <p key={issue}>{issue}</p>)}
          {pricesChanged && !cart.hasUnavailableItems && <CartActions showAcceptPrices />}
          {cart.hasUnavailableItems && <Link href="/cart">Update your cart</Link>}
        </div>
      )}
      <div className="checkout-layout">
        <section className="cart-lines" aria-label="Order items">
          {cart.items.map((item) => (
            <article className="cart-line" key={item.menuItemId}>
              <div><h2>{item.name}</h2><p>Quantity {item.quantity}</p></div>
              <p>{formatMoney(item.currentUnitPriceMinor * item.quantity, cart.store.currency)}</p>
            </article>
          ))}
        </section>
        <aside className="order-summary" aria-labelledby="checkout-summary-heading">
          <h2 id="checkout-summary-heading">Final total</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatMoney(cart.quote.subtotalMinor, cart.quote.currency)}</dd></div>
            <div><dt>Student savings</dt><dd>−{formatMoney(cart.quote.discountMinor, cart.quote.currency)}</dd></div>
            <div><dt>Fees</dt><dd>{formatMoney(cart.quote.feeMinor, cart.quote.currency)}</dd></div>
            <div className="summary-total"><dt>Total due now</dt><dd>{formatMoney(cart.quote.totalMinor, cart.quote.currency)}</dd></div>
          </dl>
          {canPay && cart.fingerprint ? (
            <CheckoutConfirmation quoteFingerprint={cart.fingerprint} />
          ) : <p>Confirm the updated prices or fix availability before paying.</p>}
          <Link className="back-link" href="/cart">Back to cart</Link>
        </aside>
      </div>
    </main>
  );
}