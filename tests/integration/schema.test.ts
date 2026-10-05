import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/src/db/client';
import { resetDatabase } from './helpers/db';

async function createStoreWithItem() {
  const vendor = await db.user.create({
    data: { email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
  });
  const store = await db.store.create({
    data: {
      ownerId: vendor.id,
      name: 'Juniper & Grain',
      slug: 'juniper-grain',
      description: 'Grain bowls',
      campus: 'BYU Provo',
      address: '1 Campus Dr',
      countryCode: 'US',
      currency: 'USD',
      hoursText: 'Mon-Fri 11am-7pm',
    },
  });
  const menuItem = await db.menuItem.create({
    data: {
      storeId: store.id,
      name: 'Harvest bowl',
      description: 'Squash and farro',
      category: 'Bowls',
      priceMinor: 1250,
      studentPriceMinor: 895,
      dietaryTags: ['VEGETARIAN'],
      allergens: ['SESAME'],
    },
  });
  return { vendor, store, menuItem };
}

async function createOrder(
  storeId: string,
  menuItemId: string,
  overrides: { quantity?: number; totalMinor?: number } = {}
) {
  const student = await db.user.create({
    data: { email: `student-${Date.now()}@byu.edu`, name: 'Student' },
  });
  const quantity = overrides.quantity ?? 2;
  return db.order.create({
    data: {
      studentId: student.id,
      storeId,
      subtotalMinor: 1250 * quantity,
      discountMinor: 355 * quantity,
      totalMinor: overrides.totalMinor ?? 895 * quantity,
      currency: 'USD',
      idempotencyKey: `key-${Date.now()}-${Math.random()}`,
      items: {
        create: {
          menuItemId,
          quantity,
          nameSnapshot: 'Harvest bowl',
          basePriceMinor: 1250,
          unitPriceMinor: 895,
          lineTotalMinor: 895 * quantity,
        },
      },
    },
    include: { items: true },
  });
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await db.$disconnect();
});

describe('schema', () => {
  it('stores a full order with its line items', async () => {
    const { store, menuItem } = await createStoreWithItem();

    const order = await createOrder(store.id, menuItem.id);

    expect(order.status).toBe('PLACED');
    expect(order.paymentStatus).toBe('UNPAID');
    expect(order.fulfillment).toBe('PICKUP');
    expect(order.items).toHaveLength(1);
  });

  it('defaults a new user to an unverified US student', async () => {
    const user = await db.user.create({
      data: { email: 'new@byu.edu', name: 'New' },
    });

    expect(user.role).toBe('STUDENT');
    expect(user.studentVerifiedAt).toBeNull();
    expect(user.countryCode).toBe('US');
  });
});

describe('database rules', () => {
  it('rejects a duplicate email', async () => {
    await db.user.create({ data: { email: 'a@byu.edu', name: 'A' } });

    await expect(
      db.user.create({ data: { email: 'a@byu.edu', name: 'B' } })
    ).rejects.toThrow();
  });

  it('rejects an email that was not lowercased', async () => {
    await expect(
      db.user.create({ data: { email: 'Mixed@BYU.edu', name: 'A' } })
    ).rejects.toThrow(/User_email_lowercase_check/);
  });

  it('rejects a lowercase or wrong-length currency code', async () => {
    const { store } = await createStoreWithItem();

    await expect(
      db.store.update({ where: { id: store.id }, data: { currency: 'usd' } })
    ).rejects.toThrow(/Store_currency_check/);
  });

  it('rejects a zero price', async () => {
    const { store } = await createStoreWithItem();

    await expect(
      db.menuItem.create({
        data: {
          storeId: store.id,
          name: 'Free',
          description: '',
          category: 'Drinks',
          priceMinor: 0,
        },
      })
    ).rejects.toThrow(/MenuItem_priceMinor_check/);
  });

  it('rejects a student price that is not below the base price', async () => {
    const { menuItem } = await createStoreWithItem();

    await expect(
      db.menuItem.update({
        where: { id: menuItem.id },
        data: { studentPriceMinor: 1250 },
      })
    ).rejects.toThrow(/MenuItem_studentPriceMinor_check/);
  });

  it('rejects a quantity above 20', async () => {
    const { store, menuItem } = await createStoreWithItem();

    await expect(
      createOrder(store.id, menuItem.id, { quantity: 21 })
    ).rejects.toThrow(/OrderItem_quantity_check/);
  });

  it('rejects an order whose total does not equal subtotal minus discount', async () => {
    const { store, menuItem } = await createStoreWithItem();

    await expect(
      createOrder(store.id, menuItem.id, { totalMinor: 1 })
    ).rejects.toThrow(/Order_amounts_check/);
  });

  it('refuses to delete a menu item that has been ordered', async () => {
    const { store, menuItem } = await createStoreWithItem();
    await createOrder(store.id, menuItem.id);

    await expect(
      db.menuItem.delete({ where: { id: menuItem.id } })
    ).rejects.toThrow();
  });

  it('deletes line items with their order', async () => {
    const { store, menuItem } = await createStoreWithItem();
    const order = await createOrder(store.id, menuItem.id);

    await db.order.delete({ where: { id: order.id } });

    expect(await db.orderItem.count()).toBe(0);
  });
});
