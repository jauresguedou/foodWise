import { createHash } from "node:crypto";
import type { CartData } from "../server/cart";
import type { OrderQuote } from "./money";

export function quoteFingerprint(cart: CartData, quote: OrderQuote): string {
  const canonicalQuote = {
    cart: cart.lines.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
    currency: quote.currency,
    subtotalMinor: quote.subtotalMinor,
    discountMinor: quote.discountMinor,
    feeMinor: quote.feeMinor,
    totalMinor: quote.totalMinor,
    lines: quote.lines.map(({ menuItemId, unitPriceMinor, lineTotalMinor }) => ({
      menuItemId,
      unitPriceMinor,
      lineTotalMinor,
    })),
  };
  return createHash("sha256").update(JSON.stringify(canonicalQuote)).digest("hex");
}