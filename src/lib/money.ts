// Money helpers keep display and pricing logic consistent across all queries.
// The app stores prices in minor units, so we never do floating-point math.
export function formatMoney(amountMinor: number, currency = "USD", locale = "en-US"): string {
  const normalizedAmount = Number.isFinite(amountMinor) ? Math.trunc(amountMinor) : 0;
  const fractionDigits = currency === "JPY" ? 0 : 2;
  const divisor = currency === "JPY" ? 1 : 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(normalizedAmount / divisor);
}

// Student discounts only apply when a verified student is viewing the result.
// This keeps the pricing decision on the server instead of trusting client input.
export function effectivePriceMinor(
  item: { priceMinor: number; studentPriceMinor?: number | null },
  isVerifiedStudent: boolean,
): number {
  if (isVerifiedStudent && item.studentPriceMinor != null) {
    return item.studentPriceMinor;
  }

  return item.priceMinor;
}
