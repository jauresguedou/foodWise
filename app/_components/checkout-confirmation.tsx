"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createCheckoutSession,
  initialCheckoutState,
} from "../../src/server/actions/orders";

export function CheckoutConfirmation({ quoteFingerprint }: { quoteFingerprint: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCheckoutSession, initialCheckoutState);

  useEffect(() => {
    if (state.kind === "redirect" && state.url) window.location.assign(state.url);
    if (state.kind === "changed") router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="checkout-confirmation">
      <input type="hidden" name="quoteFingerprint" value={quoteFingerprint} />
      <p className="payment-note">Payment is collected securely by Stripe. FoodWise never receives or stores your card number.</p>
      <button className="primary-link" type="submit" disabled={isPending}>
        {isPending ? "Preparing secure checkout..." : "Confirm and pay"}
      </button>
      <p className="checkout-status" role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}