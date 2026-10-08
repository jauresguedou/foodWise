import type { Metadata } from 'next';
import Link from 'next/link';
import { getStudentEmailDomains } from '@/src/auth/eligibility';
import { requireUser } from '@/src/auth/session';
import { VerificationNotice } from '@/src/components/auth/VerificationNotice';
import { SimpleHeader } from '@/src/components/layout/SimpleHeader';
import { secondaryButtonClassName } from '@/src/components/shared/styles';
import type { Role } from '@/src/generated/prisma/enums';
import { signOut } from '@/src/server/actions/auth';
import { getMyProfile } from '@/src/server/queries/profile';

export const metadata: Metadata = {
  title: 'Your account | FoodWise',
};

const roleLabels: Record<Role, string> = {
  STUDENT: 'Student',
  VENDOR: 'Vendor',
  ADMIN: 'Administrator',
};

// Any signed-in user may open this page, verified or not, because it is
// where unverified students learn how to get verified.
export default async function AccountPage({
  searchParams,
}: PageProps<'/account'>) {
  const user = await requireUser();
  const profile = await getMyProfile();
  const { verification } = await searchParams;

  const country =
    new Intl.DisplayNames(['en'], { type: 'region' }).of(profile.countryCode) ??
    profile.countryCode;
  const verifiedOn = profile.studentVerifiedAt
    ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(
        profile.studentVerifiedAt
      )
    : null;
  const needsVerification = user.role === 'STUDENT' && !user.isVerifiedStudent;

  return (
    <>
      <SimpleHeader />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10 sm:py-12">
        <Link href="/" className={secondaryButtonClassName}>
          ← Back to home
        </Link>
        
        <h1 className="text-3xl font-extrabold tracking-tight">Your account</h1>

        {needsVerification ? (
          <VerificationNotice
            studentDomains={getStudentEmailDomains()}
            blocked={verification === 'required'}
          />
        ) : null}

        <section
          aria-labelledby="profile-heading"
          className="rounded-xl border border-(--line) bg-white p-5 shadow-sm"
        >
          <h2 id="profile-heading" className="text-lg font-extrabold">
            Profile
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-bold text-(--ink-soft)">Name</dt>
            <dd>{profile.name}</dd>
            <dt className="text-sm font-bold text-(--ink-soft)">Email</dt>
            <dd className="break-all">{profile.email}</dd>
            <dt className="text-sm font-bold text-(--ink-soft)">
              Account type
            </dt>
            <dd>{roleLabels[profile.role]}</dd>
            <dt className="text-sm font-bold text-(--ink-soft)">Country</dt>
            <dd>{country}</dd>
            {profile.role === 'STUDENT' ? (
              <>
                <dt className="text-sm font-bold text-(--ink-soft)">
                  Student status
                </dt>
                <dd>
                  {verifiedOn ? (
                    <span className="font-bold text-(--success)">
                      <span aria-hidden="true">✓ </span>
                      Verified student since {verifiedOn}
                    </span>
                  ) : (
                    <span className="font-bold text-(--warning)">
                      <span aria-hidden="true">! </span>
                      Not verified
                    </span>
                  )}
                </dd>
              </>
            ) : null}
          </dl>
        </section>

        <form action={signOut}>
          <button type="submit" className={secondaryButtonClassName}>
            Sign out
          </button>
        </form>
      </main>
    </>
  );
}
