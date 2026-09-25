"use client";

import { useActionState } from "react";
import { addToCart, type CartActionState } from "../../src/server/actions/cart";

const initialState: CartActionState = { ok: false, message: "" };

export function AddToCartButton({ menuItemId }: { menuItemId: string }) {
  const [state, formAction, isPending] = useActionState(addToCart, initialState);
  return (
    <div className="add-to-cart-control">
      <form action={formAction}>
        <input type="hidden" name="menuItemId" value={menuItemId} />
        <button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add to cart"}
        </button>
      </form>
      <p className={state.ok ? "cart-message success" : "cart-message error"} role="status" aria-live="polite">
        {state.message}
      </p>
    </div>
  );
}