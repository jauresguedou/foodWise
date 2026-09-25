import { describe, expect, it } from "vitest";
import { calculateOrderQuote, formatMoney, sumMinor, toMinor } from "../../src/lib/money";

describe("money helpers", () => {
  it("parses and formats exact minor-unit amounts", () => {
    expect(toMinor("12.99", "USD")).toBe(1299);
    expect(formatMoney(1299, "USD", "en-US")).toBe("$12.99");
    expect(formatMoney(1299, "JPY", "ja-JP")).toBe("￥1,299");
    expect(formatMoney(-1, "USD", "en-US")).toBe("-$0.01");
    expect(formatMoney(Number.MAX_SAFE_INTEGER, "USD", "en-US")).toBe("$90,071,992,547,409.91");
  });

  it("rejects precision that the currency cannot represent", () => {
    expect(() => toMinor("12.999", "USD")).toThrow();
    expect(() => toMinor("12.5", "JPY")).toThrow();
  });

  it("refuses to add values in different currencies", () => {
    expect(() => sumMinor([
      { amountMinor: 100, currency: "USD" },
      { amountMinor: 100, currency: "JPY" },
    ])).toThrow("Cannot sum different currencies.");
    expect(() => sumMinor([])).toThrow("Cannot sum an empty list without a currency.");
  });
});

describe("calculateOrderQuote", () => {
  const lines = [
    { menuItemId: "bowl", quantity: 2, priceMinor: 1250, studentPriceMinor: 900, currency: "USD" },
    { menuItemId: "wrap", quantity: 1, priceMinor: 800, studentPriceMinor: null, currency: "USD" },
  ];

  it("calculates verified-student discounts and fees in integer minor units", () => {
    expect(calculateOrderQuote(lines, true, 75)).toMatchObject({
      subtotalMinor: 3300,
      discountMinor: 700,
      feeMinor: 75,
      totalMinor: 2675,
      lines: [
        { unitPriceMinor: 900, lineTotalMinor: 1800 },
        { unitPriceMinor: 800, lineTotalMinor: 800 },
      ],
    });
  });

  it("does not apply a student price without verified eligibility", () => {
    expect(calculateOrderQuote(lines, false).totalMinor).toBe(3300);
  });

  it("rejects empty, mixed-currency, and invalid quantity carts", () => {
    expect(() => calculateOrderQuote([], true)).toThrow("The cart is empty.");
    expect(() => calculateOrderQuote([
      lines[0], { ...lines[1], currency: "CAD" },
    ], true)).toThrow("A cart cannot mix currencies.");
    expect(() => calculateOrderQuote([{ ...lines[0], quantity: 21 }], true)).toThrow();
  });
});