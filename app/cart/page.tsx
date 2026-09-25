import Link from "next/link";
import { CartActions, CartLineControls } from "../_components/cart-controls";
import { requireVerifiedStudent } from "../../src/auth/session";
import { formatMoney } from "../../src/lib/money";
import { getCartView } from "../../src/server/cart";

export default async function CartPage() {
  const student = await requireVerifiedStudent();
  const cart = await getCartView(student.isVerifiedStudent);

  if (!cart) {
    return (
      <main className="checkout-page">
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link className="primary-link" href="/#discover">Find a meal</Link>
      </main>
    );
  }

  const pricesChanged = cart.issues.some((issue) => issue.includes("price changed"));
  const showAcceptPrices = pricesChanged && !cart.hasUnavailableItems && cart.quote !== null;

  return (
    <main className="checkout-page">
      <p className="eyebrow">Your order</p>
      <h1>Your cart</h1>
      <p className="cart-store">Pickup from {cart.store.name}</p>
      {cart.issues.length > 0 && (
        <div className="checkout-alert" role="alert">
          <h2>Review your cart</h2>
          {cart.issues.map((issue) => <p key={issue}>{issue}</p>)}
        </div>
      )}
      <div className="checkout-layout">
        <section className="cart-lines" aria-label="Cart items">
          {cart.items.map((item) => (
            <article className="cart-line" key={item.menuItemId}>
              <div>
                <h2>{item.name}</h2>
                <p>{item.quantity} × {formatMoney(item.currentUnitPriceMinor, cart.store.currency)}</p>
                {item.addedUnitPriceMinor !== item.currentUnitPriceMinor && <p className="changed-price">Price updated</p>}
                {!item.isAvailable && <p className="changed-price">Unavailable</p>}
              </div>
              <CartLineControls menuItemId={item.menuItemId} name={item.name} quantity={item.quantity} />
            </article>
          ))}
          <CartActions showAcceptPrices={showAcceptPrices} />
        </section>

        <aside className="order-summary" aria-labelledby="cart-summary-heading">
          <h2 id="cart-summary-heading">Order total</h2>
          {cart.quote ? (
            <dl>
              <div><dt>Subtotal</dt><dd>{formatMoney(cart.quote.subtotalMinor, cart.quote.currency)}</dd></div>
              <div><dt>Student savings</dt><dd>−{formatMoney(cart.quote.discountMinor, cart.quote.currency)}</dd></div>
              <div><dt>Fees</dt><dd>{formatMoney(cart.quote.feeMinor, cart.quote.currency)}</dd></div>
              <div className="summary-total"><dt>Total</dt><dd>{formatMoney(cart.quote.totalMinor, cart.quote.currency)}</dd></div>
            </dl>
          ) : <p>Remove unavailable meals to see a payable total.</p>}
          {cart.quote && cart.issues.length === 0 ? (
            <Link className="primary-link" href="/checkout">Continue to checkout</Link>
          ) : <button className="primary-link" type="button" disabled>Continue to checkout</button>}
        </aside>
      </div>
    </main>
  );
}