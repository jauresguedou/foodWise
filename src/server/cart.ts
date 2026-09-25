import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { calculateOrderQuote, type OrderQuote, type PricedCartLine } from "../lib/money";
import { quoteFingerprint } from "../lib/quote-fingerprint";
import { prisma } from "../db/client";

const cartCookieName = "foodwise-cart";
const cartSchema = z.object({
  storeId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
  lines: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    addedUnitPriceMinor: z.number().int().nonnegative(),
  })).max(50),
});

export type CartData = z.infer<typeof cartSchema>;

export async function readCart(): Promise<CartData | null> {
  const signedValue = (await cookies()).get(cartCookieName)?.value;
  const secret = process.env.CART_SECRET;
  if (!signedValue || !secret) return null;
  try {
    const separator = signedValue.lastIndexOf(".");
    if (separator < 1) return null;
    const payload = signedValue.slice(0, separator);
    const signature = Buffer.from(signedValue.slice(separator + 1), "base64url");
    const expectedSignature = createHmac("sha256", secret).update(payload).digest();
    if (signature.length !== expectedSignature.length || !timingSafeEqual(signature, expectedSignature)) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const parsed = cartSchema.safeParse(JSON.parse(decoded) as unknown);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function writeCart(cart: CartData): Promise<void> {
  const secret = process.env.CART_SECRET;
  if (!secret) throw new Error("CART_SECRET is not configured.");
  const payload = Buffer.from(JSON.stringify(cart)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  (await cookies()).set(cartCookieName, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearCart(): Promise<void> {
  (await cookies()).delete(cartCookieName);
}

export type CartView = {
  cart: CartData;
  store: { id: string; name: string; currency: string };
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    currentUnitPriceMinor: number;
    addedUnitPriceMinor: number;
    isAvailable: boolean;
  }>;
  quote: OrderQuote | null;
  fingerprint: string | null;
  hasUnavailableItems: boolean;
  issues: string[];
};

export async function getCartView(isVerifiedStudent: boolean): Promise<CartView | null> {
  const cart = await readCart();
  if (!cart || cart.lines.length === 0) return null;

  const store = await prisma.store.findFirst({
    where: { id: cart.storeId, status: "PUBLISHED" },
    select: { id: true, name: true, currency: true },
  });
  if (!store) return null;

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: cart.lines.map((line) => line.menuItemId) }, storeId: store.id, archivedAt: null },
    select: {
      id: true,
      name: true,
      priceMinor: true,
      studentPriceMinor: true,
      isAvailable: true,
      inventoryQuantity: true,
    },
  });
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
  const issues: string[] = [];
  let hasUnavailableItems = false;
  const pricedLines: PricedCartLine[] = [];
  const items = cart.lines.flatMap((line) => {
    const item = menuItemById.get(line.menuItemId);
    if (!item) {
      issues.push("A meal in your cart is no longer on this menu.");
      return [];
    }
    const currentUnitPriceMinor = isVerifiedStudent && item.studentPriceMinor !== null
      ? item.studentPriceMinor
      : item.priceMinor;
    const itemAvailable = item.isAvailable && (item.inventoryQuantity === null || item.inventoryQuantity > 0);
    if (!itemAvailable) {
      hasUnavailableItems = true;
      issues.push(`${item.name} is currently unavailable or sold out.`);
    }
    if (currentUnitPriceMinor !== line.addedUnitPriceMinor) {
      issues.push(`${item.name}'s price changed. Review the updated total before paying.`);
    }
    pricedLines.push({
      menuItemId: item.id,
      quantity: line.quantity,
      priceMinor: item.priceMinor,
      studentPriceMinor: item.studentPriceMinor,
      currency: store.currency,
    });
    return [{
      menuItemId: item.id,
      name: item.name,
      quantity: line.quantity,
      currentUnitPriceMinor,
      addedUnitPriceMinor: line.addedUnitPriceMinor,
      isAvailable: itemAvailable,
    }];
  });

  let quote: OrderQuote | null = null;
  if (!hasUnavailableItems && pricedLines.length === cart.lines.length) {
    quote = calculateOrderQuote(pricedLines, isVerifiedStudent);
  }
  return {
    cart,
    store,
    items,
    quote,
    fingerprint: quote ? quoteFingerprint(cart, quote) : null,
    hasUnavailableItems,
    issues,
  };
}