"use client";

import { useActionState } from "react";
import {
  acceptCartPriceUpdates,
  clearStudentCart,
  updateCartLine,
  type CartActionState,
} from "../../src/server/actions/cart";

const initialState: CartActionState = { ok: false, message: "" };

export function CartLineControls({ menuItemId, name, quantity }: {
  menuItemId: string;
  name: string;
  quantity: number;
}) {
  const [state, formAction, pending] = useActionState(updateCartLine, initialState);
  return (
    <div className="cart-line-controls">
      <form action={formAction} className="quantity-form">
        <input type="hidden" name="menuItemId" value={menuItemId} />
        <label htmlFor={`quantity-${menuItemId}`}>Quantity for {name}</label>
        <input id={`quantity-${menuItemId}`} name="quantity" type="number" min="1" max="20" defaultValue={quantity} />
        <button type="submit" disabled={pending}>Update</button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="menuItemId" value={menuItemId} />
        <button className="text-button" type="submit" name="quantity" value="0" disabled={pending}>
          Remove
        </button>
      </form>
      <p className="cart-message" role="status" aria-live="polite">{state.message}</p>
    </div>
  );
}

export function CartActions({ showAcceptPrices }: { showAcceptPrices: boolean }) {
  const [priceState, acceptPrices, pricePending] = useActionState(acceptCartPriceUpdates, initialState);
  const [clearState, clearCart, clearPending] = useActionState(clearStudentCart, initialState);
  return (
    <div className="cart-actions">
      {showAcceptPrices && (
        <form action={acceptPrices}>
          <button type="submit" disabled={pricePending}>{pricePending ? "Refreshing..." : "Accept updated prices"}</button>
          <p role="status" aria-live="polite">{priceState.message}</p>
        </form>
      )}
      <form action={clearCart}>
        <button className="text-button" type="submit" disabled={clearPending}>Clear cart</button>
        <p role="status" aria-live="polite">{clearState.message}</p>
      </form>
    </div>
  );
}