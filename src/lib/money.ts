export type Money = {
  amountMinor: number;
  currency: string;
};

export type PricedCartLine = {
  menuItemId: string;
  quantity: number;
  priceMinor: number;
  studentPriceMinor: number | null;
  currency: string;
};

export type PricedOrderLine = PricedCartLine & {
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type OrderQuote = {
  lines: PricedOrderLine[];
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  feeMinor: number;
  totalMinor: number;
};

function assertMinorAmount(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError("Money amounts must be safe integer minor units.");
  }
}

export function currencyDecimals(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency })
      .resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    throw new RangeError(`Unsupported currency: ${currency}`);
  }
}

export function toMinor(input: string, currency: string): number {
  const value = input.trim();
  if (value.length > 32) throw new RangeError("Money amount is too large.");
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new RangeError("Enter a valid non-negative decimal amount.");

  const decimals = currencyDecimals(currency);
  const fraction = match[2] ?? "";
  if (fraction.length > decimals) {
    throw new RangeError(`${currency} accepts at most ${decimals} decimal places.`);
  }

  const scale = BigInt(10) ** BigInt(decimals);
  const major = BigInt(match[1]);
  const minor = BigInt(fraction.padEnd(decimals, "0") || "0");
  const amountMinor = major * scale + minor;
  if (amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Money amount is too large.");
  }
  return Number(amountMinor);
}

export function formatMoney(amountMinor: number, currency: string, locale = "en-US"): string {
  assertMinorAmount(amountMinor);
  const decimals = currencyDecimals(currency);
  const divisor = BigInt(10) ** BigInt(decimals);
  const amount = BigInt(amountMinor);
  const absoluteAmount = amount < BigInt(0) ? -amount : amount;
  const major = absoluteAmount / divisor;
  const fraction = (absoluteAmount % divisor).toString().padStart(decimals, "0");
  const currencyFormatter = new Intl.NumberFormat(locale, { style: "currency", currency });
  const majorFormatter = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 });
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 0 });
  const localizedFraction = fraction.replace(/\d/g, (digit) => digitFormatter.format(Number(digit)));
  const numericParts = currencyFormatter.formatToParts(amount < BigInt(0) ? BigInt(-1) : BigInt(1));
  const localizedMajor = majorFormatter.formatToParts(major)
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("");
  let majorInserted = false;
  return numericParts.map((part) => {
    if (part.type === "integer") {
      if (majorInserted) return "";
      majorInserted = true;
      return localizedMajor;
    }
    if (part.type === "group") return "";
    if (part.type === "fraction") return localizedFraction;
    return part.value;
  }).join("");
}

export function sumMinor(amounts: Money[]): Money {
  if (amounts.length === 0) throw new RangeError("Cannot sum an empty list without a currency.");
  const currency = amounts[0].currency;
  let amountMinor = 0;
  for (const amount of amounts) {
    if (amount.currency !== currency) throw new RangeError("Cannot sum different currencies.");
    assertMinorAmount(amount.amountMinor);
    amountMinor += amount.amountMinor;
    assertMinorAmount(amountMinor);
  }
  return { amountMinor, currency };
}

export function calculateOrderQuote(
  lines: PricedCartLine[],
  isVerifiedStudent: boolean,
  feeMinor = 0,
): OrderQuote {
  assertMinorAmount(feeMinor);
  if (feeMinor < 0) throw new RangeError("Fees cannot be negative.");
  if (lines.length === 0) throw new RangeError("The cart is empty.");

  const currency = lines[0].currency;
  let subtotalMinor = 0;
  let discountMinor = 0;
  const pricedLines = lines.map((line): PricedOrderLine => {
    if (line.currency !== currency) throw new RangeError("A cart cannot mix currencies.");
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      throw new RangeError("Quantity must be between 1 and 20.");
    }
    assertMinorAmount(line.priceMinor);
    if (line.priceMinor <= 0) throw new RangeError("Menu prices must be positive.");
    if (line.studentPriceMinor !== null) {
      assertMinorAmount(line.studentPriceMinor);
      if (line.studentPriceMinor < 0 || line.studentPriceMinor >= line.priceMinor) {
        throw new RangeError("Student price must be lower than the regular price.");
      }
    }

    const unitPriceMinor = isVerifiedStudent && line.studentPriceMinor !== null
      ? line.studentPriceMinor
      : line.priceMinor;
    const lineTotalMinor = unitPriceMinor * line.quantity;
    assertMinorAmount(lineTotalMinor);
    subtotalMinor += line.priceMinor * line.quantity;
    discountMinor += (line.priceMinor - unitPriceMinor) * line.quantity;
    assertMinorAmount(subtotalMinor);
    assertMinorAmount(discountMinor);
    return { ...line, unitPriceMinor, lineTotalMinor };
  });

  const totalMinor = subtotalMinor - discountMinor + feeMinor;
  assertMinorAmount(totalMinor);
  return { lines: pricedLines, currency, subtotalMinor, discountMinor, feeMinor, totalMinor };
}