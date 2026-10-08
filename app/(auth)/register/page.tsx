import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStudentEmailDomains } from '@/src/auth/eligibility';
import { getSession } from '@/src/auth/session';
import { RegisterForm } from '@/src/components/auth/RegisterForm';
import { textLinkClassName } from '@/src/components/shared/styles';
import { getCountryOptions } from '@/src/lib/countries';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';
import { authCallbackSearchParamsSchema } from '@/src/validation/auth';

export const metadata: Metadata = {
  title: 'Create an account | FoodWise',
};

export default async function RegisterPage({
  searchParams,
}: PageProps<'/register'>) {
  const params = await searchParams;
  // A repeated query parameter arrives as an array. The schema drops it, then
  // safeCallbackUrl keeps the redirect on this origin.
  const parsedParams = authCallbackSearchParamsSchema.safeParse({
    callbackUrl: params.callbackUrl,
  });
  const target = safeCallbackUrl(
    parsedParams.success ? parsedParams.data.callbackUrl : undefined
  );
  if (await getSession()) redirect(target);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-(--ink-soft)">
          Browse meals without an account. Sign up to order and get student
          prices.
        </p>
      </div>
      <RegisterForm
        countries={getCountryOptions()}
        studentDomains={getStudentEmailDomains()}
        callbackUrl={target}
      />
      <p className="text-(--ink-soft)">
        Already have an account?{' '}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(target)}`}
          className={textLinkClassName}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
