import 'server-only';

import { notFound } from 'next/navigation';
import { db} from '@/src/db/client';
import { requireVendor } from '@/src/auth/session';

export async function assertOwnsStore(storeId: string) {
  const user = await requireVendor();

  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!store || store.ownerId !== user.id) {
    notFound();
  }

  return {
    user,
    store,
  };
}