'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/src/db/client';
import { requireVendor } from '@/src/auth/session';
import { currencyCodes } from '@/src/lib/currencies';

const storeSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required.'),
  campus: z.string().trim().min(1, 'Campus is required.'),
  address: z.string().trim().min(1, 'Address is required.'),
  hours: z.string().trim().min(1, 'Business hours are required.'),
  contactEmail: z.string().trim().email('Enter a valid contact email.'),
  phone: z.string().trim().optional(),
  currency: z.enum(currencyCodes, {
    message: 'Select a supported currency.',
  }),
  pickup: z.boolean(),
  delivery: z.boolean(),
});

export type CreateStoreState = {
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
};

export async function saveStore(
  _previousState: CreateStoreState,
  formData: FormData,
): Promise<CreateStoreState> {
  const user = await requireVendor();
  const storeId = formData.get('storeId');

  const validated = storeSchema.safeParse({
    name: formData.get('name'),
    campus: formData.get('campus'),
    address: formData.get('address'),
    hours: formData.get('hours'),
    contactEmail: formData.get('contactEmail'),
    phone: formData.get('phone') || undefined,
    currency: formData.get('currency'),
    pickup: formData.get('pickup') === 'on',
    delivery: formData.get('delivery') === 'on',
  });

  if (!validated.success) {
    return {
      success: false,
      message: 'Please correct the highlighted fields.',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;

  if (!data.pickup && !data.delivery) {
    return {
      success: false,
      message: 'Select at least one fulfillment option.',
      errors: {
        pickup: ['Select pickup or delivery.'],
      },
    };
  }

  // UPDATE an existing store.
  if (typeof storeId === 'string' && storeId.length > 0) {
    const existingStore = await db.store.findFirst({
      where: {
        id: storeId,
        ownerId: user.id,
      },
      select: {
        id: true,
        currency: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existingStore) {
      return {
        success: false,
        message: 'Store not found or you do not own it.',
        errors: {},
      };
    }

    if (
      existingStore.currency !== data.currency &&
      existingStore._count.orders > 0
    ) {
      return {
        success: false,
        message: 'Currency cannot be changed after orders exist.',
        errors: {
          currency: [
            'This store already has orders. Its currency is locked.',
          ],
        },
      };
    }

    await db.store.update({
      where: { id: existingStore.id },
      data: {
        name: data.name,
        campus: data.campus,
        address: data.address,
        hoursText: data.hours,
        contactEmail: data.contactEmail,
        phone: data.phone || null,
        currency: data.currency,
        pickupAvailable: data.pickup,
        deliveryAvailable: data.delivery,
      },
    });

    revalidatePath('/vendor');
    revalidatePath('/');

    return {
      success: true,
      message: 'Store details updated successfully.',
      errors: {},
    };
  }

  // CREATE a new store.
  const slugBase = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const slug = `${slugBase || 'store'}-${Date.now()}`;

  await db.store.create({
    data: {
      ownerId: user.id,
      name: data.name,
      slug,
      description: '',
      campus: data.campus,
      address: data.address,
      contactEmail: data.contactEmail,
      phone: data.phone || null,
      countryCode: user.countryCode,
      currency: data.currency,
      hoursText: data.hours,
      pickupAvailable: data.pickup,
      deliveryAvailable: data.delivery,
      status: 'PENDING_REVIEW',
    },
  });

  revalidatePath('/vendor');
  revalidatePath('/');

  return {
    success: true,
    message: 'Store created and submitted for review.',
    errors: {},
  };
}


export type DeleteStoreState = {
  success: boolean;
  message: string;
};

export async function deleteStore(
  storeId: string,
): Promise<DeleteStoreState> {
  const user = await requireVendor();

  if (!storeId || storeId.trim().length === 0) {
    return {
      success: false,
      message: 'A valid store ID is required.',
    };
  }

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      ownerId: user.id,
    },
    select: {
      id: true,
      _count: {
        select: {
          orders: true,
          menuItems: true,
        },
      },
    },
  });

  if (!store) {
    return {
      success: false,
      message: 'Store not found or you do not own it.',
    };
  }

  const hasHistory =
    store._count.orders > 0 || store._count.menuItems > 0;

  if (hasHistory) {
    await db.store.update({
      where: { id: store.id },
      data: { status: 'SUSPENDED' },
    });

    revalidatePath('/vendor');
    revalidatePath('/');

    return {
      success: true,
      message:
        'Store suspended. Its menu records and order history have been preserved.',
    };
  }

  await db.store.delete({
    where: { id: store.id },
  });

  revalidatePath('/vendor');
  revalidatePath('/');

  return {
    success: true,
    message: 'Store deleted successfully.',
  };
}