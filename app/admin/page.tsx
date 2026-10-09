
import Link from 'next/link';
import { requireAdmin } from '@/src/auth/session';
import { db } from '@/src/db/client';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    totalUsers,
    totalVendors,
    pendingApplications,
    totalStores,
    totalMenuItems,
    totalOrders,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'VENDOR' } }),
    db.vendorApplication.count({ where: { status: 'PENDING' } }),
    db.store.count(),
    db.menuItem.count(),
    db.order.count(),
  ]);

  const statistics = [
    { label: 'Total users', value: totalUsers },
    { label: 'Approved vendors', value: totalVendors },
    { label: 'Pending applications', value: pendingApplications },
    { label: 'Total stores', value: totalStores },
    { label: 'Menu items', value: totalMenuItems },
    { label: 'Total orders', value: totalOrders },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          FoodWise Administration
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Admin dashboard
        </h1>

        <p className="text-gray-600">
          Monitor your platform and manage its users, vendors, stores, and orders.
        </p>
      </header>

      <section aria-labelledby="statistics-heading" className="space-y-4">
        <h2 id="statistics-heading" className="text-xl font-semibold">
          Platform overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statistics.map((statistic) => (
            <article
              key={statistic.label}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-600">
                {statistic.label}
              </p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {statistic.value.toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="management-heading" className="space-y-4">
        <h2 id="management-heading" className="text-xl font-semibold">
          Management
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold">
              Vendor applications
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Review vendor applications and approve or reject applicants.
            </p>

            <p className="mt-3 text-sm font-medium">
              {pendingApplications} pending
            </p>

            <Link
              href="/admin/vendor-applications"
              className="mt-5 inline-flex rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              Review applications
            </Link>
          </article>

          <article className="rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold">
              Platform management
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              User management, store moderation, and order monitoring will be
              added in the next development steps.
            </p>

            <p className="mt-3 text-sm text-gray-500">
              More management tools coming soon.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}