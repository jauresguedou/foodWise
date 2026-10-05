import { SimpleHeader } from '@/src/components/layout/SimpleHeader';

// Sign-in and registration. Visitors here are signed out, so no user menu.
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SimpleHeader showUserMenu={false} />
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-12">
        {children}
      </main>
    </>
  );
}
