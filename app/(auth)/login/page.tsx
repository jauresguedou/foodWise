import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '../_components/AuthForm';
import { getSession } from '@/src/auth/session';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';
import { authCallbackSearchParamsSchema } from '@/src/validation/auth';

export const metadata: Metadata = {
  title: 'Sign in | FoodWise',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
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
        <p className="eyebrow">Welcome back</p>
        <h1>Good to see you.</h1>
        <p className="auth-intro">
          Sign in with a one-time code sent to your email. No password needed.
        </p>
        <AuthForm mode="login" callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
