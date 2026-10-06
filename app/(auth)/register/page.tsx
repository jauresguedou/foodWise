import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '../_components/AuthForm';
import { getSession } from '@/src/auth/session';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';
import { authCallbackSearchParamsSchema } from '@/src/validation/auth';

export const metadata: Metadata = {
  title: 'Create account | FoodWise',
};

export default async function RegisterPage({
  searchParams,
}: PageProps<'/register'>) {
  const params = await searchParams;
  const parsedParams = authCallbackSearchParamsSchema.safeParse({
    callbackUrl: params.callbackUrl,
  });
  const callbackUrl = safeCallbackUrl(
    parsedParams.success ? parsedParams.data.callbackUrl : undefined
  );
  if (await getSession()) redirect(callbackUrl);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand" href="/" aria-label="FoodWise home">
          <span className="brand-mark" aria-hidden="true">
            FW
          </span>
          <span>
            food<span>wise</span>
          </span>
        </Link>
        <p className="eyebrow">Join FoodWise</p>
        <h1>Affordable meals start here.</h1>
        <p className="auth-intro">
          Create an account with your email. A verified school email unlocks
          student prices.
        </p>
        <AuthForm mode="register" callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
