import Link from 'next/link';
import { textLinkClassName } from '@/src/components/shared/styles';

// Explains how an unverified account gets student prices. `blocked` is set
// when the student was just sent here from a student-only page.
export function VerificationNotice({
  studentDomains,
  blocked = false,
}: {
  studentDomains: string[];
  blocked?: boolean;
}) {
  const domainList = studentDomains.map((domain) => `@${domain}`).join(' or ');

  return (
    <section
      aria-labelledby="verification-heading"
      className="rounded-xl border-2 border-(--warning) bg-white p-5"
    >
      <h2 id="verification-heading" className="text-lg font-extrabold">
        {blocked ? 'That page is for verified students' : 'Get student prices'}
      </h2>
      <p className="mt-2 text-(--ink-soft)">
        Student prices and student-only features need a verified school email
        address{domainList ? ` ending in ${domainList}` : ''}. Your account uses
        a different address.
      </p>
      <p className="mt-2 text-(--ink-soft)">
        To verify, sign out, then{' '}
        <Link href="/register" className={textLinkClassName}>
          create an account with your school email
        </Link>
        . We&apos;ll send a code to that address, and entering it verifies you.
      </p>
    </section>
  );
}
