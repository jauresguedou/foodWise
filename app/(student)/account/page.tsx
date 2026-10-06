import type { Metadata } from 'next';
import Link from 'next/link';
import { getMyProfile } from '@/src/server/queries/profile';

export const metadata: Metadata = {
  title: 'Your account | FoodWise',
};

export default async function AccountPage() {
  const profile = await getMyProfile();
  const isVerifiedStudent =
    profile.role === 'STUDENT' && profile.studentVerifiedAt !== null;

  return (
    <main className="account-page">
      <div className="account-card">
        <Link href="/" className="account-back">
          &larr; Back to meals
        </Link>
        <p className="eyebrow">Your account</p>
        <h1>Account details</h1>
        <dl className="account-details">
          <div>
            <dt>Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{formatRole(profile.role)}</dd>
          </div>
          <div>
            <dt>Student eligibility</dt>
            <dd>
              {profile.role !== 'STUDENT'
                ? 'Not applicable to this account role'
                : isVerifiedStudent
                  ? 'Verified'
                  : 'Not verified'}
            </dd>
          </div>
        </dl>
        {profile.role === 'STUDENT' && !isVerifiedStudent && (
          <section
            className="verification-notice"
            aria-labelledby="verification-heading"
          >
            <h2 id="verification-heading">How to become verified</h2>
            <p>
              Student eligibility is confirmed when you sign in with an email
              address from a supported school domain and enter the code sent to
              that address.
            </p>
            <p>
              If this account uses a different email, sign out and create an
              account with your school email address.
            </p>
            <Link href="/register">Create an account with a school email</Link>
          </section>
        )}
        <p className="account-note">
          <Link href="/">Explore meals</Link>
        </p>
      </div>
    </main>
  );
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
