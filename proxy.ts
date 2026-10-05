import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

// UX only: sends visitors with no session cookie to /login before they load a
// protected page. It does not check that the session is valid. Every page,
// Server Action, and query still checks for itself (src/auth/session.ts).
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const login = new URL('/login', request.url);
  login.searchParams.set(
    'callbackUrl',
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/account/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/vendor/:path*',
  ],
};
