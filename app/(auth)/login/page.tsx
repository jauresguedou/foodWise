import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/src/auth/session';
import { LoginForm } from '@/src/components/auth/LoginForm';
import { textLinkClassName } from '@/src/components/shared/styles';
import { safeCallbackUrl } from '@/src/lib/safe-redirect';

export const metadata: Metadata = {
  title: 'Sign in | FoodWise',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(
    typeof callbackUrl === 'string' ? callbackUrl : undefined
  );
  if (await getSession()) redirect(target);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-(--ink-soft)">
          We&apos;ll email you a 6-digit code. No password needed.
        </p>
      </div>
      <LoginForm callbackUrl={target} />
      <p className="text-(--ink-soft)">
        New to FoodWise?{' '}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(target)}`}
          className={textLinkClassName}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
