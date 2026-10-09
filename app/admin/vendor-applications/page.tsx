
import { requireAdmin } from '@/src/auth/session';
import { db } from '@/src/db/client';
import { VendorApplicationReview } from './review-buttons';

export const dynamic = 'force-dynamic';

export default async function VendorApplicationsPage() {
  await requireAdmin();

  const applications = await db.vendorApplication.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
          emailVerified: true,
          countryCode: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Vendor applications</h1>
        <p className="text-gray-600">
          Review applications and decide who can become a FoodWise vendor.
        </p>
      </header>

      <p className="text-sm text-gray-600">
        Pending applications: {applications.length}
      </p>

      {applications.length === 0 ? (
        <section className="rounded-lg border p-6">
          <h2 className="font-semibold">No pending applications</h2>
          <p className="mt-2 text-sm text-gray-600">
            New vendor applications will appear here.
          </p>
        </section>
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li
              key={application.id}
              className="rounded-lg border p-5 shadow-sm"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {application.user.name}
                </h2>

                <p className="text-sm text-gray-700">
                  Email: {application.user.email}
                </p>

                <p className="text-sm text-gray-700">
                  Country: {application.user.countryCode}
                </p>

                <p className="text-sm text-gray-700">
                  Email verified:{' '}
                  {application.user.emailVerified ? 'Yes' : 'No'}
                </p>

                <p className="text-sm text-gray-500">
                  Applied:{' '}
                  {application.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div className="mt-5">
                <VendorApplicationReview
                  applicationId={application.id}
                  emailVerified={application.user.emailVerified}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}