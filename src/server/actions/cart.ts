"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireVerifiedStudent } from "../../auth/session";
import { prisma } from "../../db/client";
import { calculateOrderQuote } from "../../lib/money";
import { clearCart, readCart, writeCart } from "../cart";

export type CartActionState = { ok: boolean; message: string; itemCount?: number };

const addToCartSchema = z.object({ menuItemId: z.string().min(1).max(100) });

export async function addToCart(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const student = await requireVerifiedStudent();
  const parsed = addToCartSchema.safeParse({ menuItemId: formData.get("menuItemId") });
  if (!parsed.success) return { ok: false, message: "That meal could not be added." };

  const item = await prisma.menuItem.findFirst({
    where: {
      id: parsed.data.menuItemId,
      isAvailable: true,
      archivedAt: null,
      store: { status: "PUBLISHED", pickupAvailable: true },
    },
    select: {
      id: true,
      storeId: true,
      priceMinor: true,
      studentPriceMinor: true,
      inventoryQuantity: true,
    },
  });
  if (!item || (item.inventoryQuantity !== null && item.inventoryQuantity < 1)) {
    return { ok: false, message: "That meal is no longer available." };
  }

  let current = await readCart();
  if (current) {
    const existingOrder = await prisma.order.findUnique({
      where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: current.idempotencyKey } },
      select: { status: true },
    });
    if (existingOrder?.status === "PAYMENT_PENDING") {
      return { ok: false, message: "Checkout is already in progress for this cart." };
    }
    if (existingOrder) current = null;
  }
  if (current && current.storeId !== item.storeId) {
    return { ok: false, message: "Your cart has meals from another store. Clear it before adding this meal." };
  }
  const next = current ?? { storeId: item.storeId, idempotencyKey: randomUUID(), lines: [] };
  const existing = next.lines.find((line) => line.menuItemId === item.id);
  if (existing && existing.quantity >= 20) {
    return { ok: false, message: "You can order up to 20 of one meal." };
  }
  const addedUnitPriceMinor = student.isVerifiedStudent && item.studentPriceMinor !== null
    ? item.studentPriceMinor
    : item.priceMinor;
  const lines = existing
    ? next.lines.map((line) => line.menuItemId === item.id
      ? { ...line, quantity: line.quantity + 1 }
      : line)
    : [...next.lines, { menuItemId: item.id, quantity: 1, addedUnitPriceMinor }];
  await writeCart({ ...next, lines });
  return { ok: true, message: "Added to cart.", itemCount: lines.reduce((count, line) => count + line.quantity, 0) };
}

const updateLineSchema = z.object({
  menuItemId: z.string().min(1).max(100),
  quantity: z.coerce.number().int().min(0).max(20),
});

export async function updateCartLine(
  _previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const student = await requireVerifiedStudent();
  const parsed = updateLineSchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { ok: false, message: "Choose a quantity from 1 to 20." };
  const cart = await readCart();
  if (!cart) return { ok: false, message: "Your cart is empty." };
  const existingOrder = await prisma.order.findUnique({
    where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: cart.idempotencyKey } },
    select: { id: true },
  });
  if (existingOrder) return { ok: false, message: "This cart already has a checkout in progress." };
  const lines = parsed.data.quantity === 0
    ? cart.lines.filter((line) => line.menuItemId !== parsed.data.menuItemId)
    : cart.lines.map((line) => line.menuItemId === parsed.data.menuItemId
      ? { ...line, quantity: parsed.data.quantity }
      : line);
  if (lines.length === 0) await clearCart();
  else await writeCart({ ...cart, lines });
  return { ok: true, message: "Cart updated.", itemCount: lines.reduce((count, line) => count + line.quantity, 0) };
}

export async function acceptCartPriceUpdates(
  previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previous;
  void formData;
  const student = await requireVerifiedStudent();
  const cart = await readCart();
  if (!cart || cart.lines.length === 0) return { ok: false, message: "Your cart is empty." };

  const existingOrder = await prisma.order.findUnique({
    where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: cart.idempotencyKey } },
  });
  if (existingOrder) return { ok: false, message: "This cart already has a checkout in progress." };

  const store = await prisma.store.findFirst({
    where: { id: cart.storeId, status: "PUBLISHED", pickupAvailable: true },
    select: { currency: true },
  });
  const items = await prisma.menuItem.findMany({
    where: {
      id: { in: cart.lines.map((line) => line.menuItemId) },
      storeId: cart.storeId,
      isAvailable: true,
      archivedAt: null,
    },
    select: { id: true, priceMinor: true, studentPriceMinor: true, inventoryQuantity: true },
  });
  if (!store || items.length !== cart.lines.length || items.some((item) => item.inventoryQuantity !== null && item.inventoryQuantity < 1)) {
    return { ok: false, message: "A meal is unavailable. Remove it before continuing." };
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const quoteLines = cart.lines.map((line) => {
    const item = byId.get(line.menuItemId)!;
    return {
      menuItemId: item.id,
      quantity: line.quantity,
      priceMinor: item.priceMinor,
      studentPriceMinor: item.studentPriceMinor,
      currency: store.currency,
    };
  });
  try {
    const quote = calculateOrderQuote(quoteLines, student.isVerifiedStudent);
    const lines = cart.lines.map((line) => {
      const pricedLine = quote.lines.find((item) => item.menuItemId === line.menuItemId)!;
      return { ...line, addedUnitPriceMinor: pricedLine.unitPriceMinor };
    });
    await writeCart({ ...cart, lines });
    return { ok: true, message: "Updated prices accepted. Review the total again before checkout." };
  } catch {
    return { ok: false, message: "We could not refresh your cart prices. Please try again." };
  }
}

export async function clearStudentCart(
  previous: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previous;
  void formData;
  const student = await requireVerifiedStudent();
  const cart = await readCart();
  if (cart) {
    const pendingOrder = await prisma.order.findUnique({
      where: { studentId_idempotencyKey: { studentId: student.id, idempotencyKey: cart.idempotencyKey } },
      select: { status: true },
    });
    if (pendingOrder?.status === "PAYMENT_PENDING") {
      return { ok: false, message: "Checkout is in progress. Wait for its payment status before clearing this cart." };
    }
  }
  await clearCart();
  return { ok: true, message: "Cart cleared.", itemCount: 0 };
}