
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/src/auth/session';
import { db } from '@/src/db/client';
import VendorWorkspace from './vendor-workspace';

export const metadata = {
  title: 'Vendor workspace | FoodWise',
  description: 'Manage your store and menu on FoodWise.',
};

export default async function VendorPage() {
  const user = await requireUser();

  // Read the current role from the database instead of relying
  // on a potentially outdated session role.
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      vendorApplication: {
        select: { status: true },
      },
    },
  });

  if (!account) {
    redirect('/login');
  }

  if (account.role !== 'VENDOR') {
    const isAdmin = account.role === 'ADMIN';
    const applicationStatus = account.vendorApplication?.status;

    const title = isAdmin
      ? 'Vendor workspace is for vendors'
      : applicationStatus === 'PENDING'
        ? 'Your application is under review'
        : applicationStatus === 'REJECTED'
          ? 'Your vendor application was not approved'
          : 'Become a FoodWise vendor';

    const description = isAdmin
      ? 'Your administrator account has access to platform management. Open the admin dashboard to manage FoodWise.'
      : applicationStatus === 'PENDING'
        ? 'Thank you for applying. Your application is awaiting an administrator’s decision. You can return here after it has been approved.'
        : applicationStatus === 'REJECTED'
          ? 'Your current vendor application was not approved. Please contact FoodWise support if you need help with the decision.'
          : 'The Vendor Workspace is available to approved vendors. If you registered as a student, you will need to submit a vendor application and receive approval before managing a store.';

    return (
      <main className="min-h-screen bg-[#F6F3EE] px-4 py-16">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[#DCE4E0] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-[#F6B94A]/25 text-2xl text-[#123C32]">
            {isAdmin ? '⚙' : '🏪'}
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-[#1F7A5A]">
            FoodWise Vendor Workspace
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#123C32]">
            {title}
          </h1>

          <p className="mt-4 leading-7 text-[#5A6B66]">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={isAdmin ? '/admin' : '/account'}
              className="inline-flex items-center justify-center rounded-lg bg-[#1F7A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123C32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A5A]"
            >
              {isAdmin ? 'Open Admin Dashboard' : 'Go to My Account'}
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-[#DCE4E0] bg-white px-5 py-3 text-sm font-semibold text-[#123C32] transition hover:bg-[#F6F3EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A5A]"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const stores = await db.store.findMany({
  where: {
    ownerId: user.id,
    status: {
      not: 'SUSPENDED',
    },
  },
  include: {
    menuItems: {
      orderBy: {
        createdAt: 'desc',
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

return <VendorWorkspace stores={stores} />;
}
