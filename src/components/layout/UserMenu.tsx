import Link from 'next/link';
import { getSession } from '@/src/auth/session';
import { signOut } from '@/src/server/actions/auth';

export async function UserMenu() {
  const user = await getSession();
  if (!user) {
    return (
      <Link className="user-menu-link" href="/login">
        Sign in
      </Link>
    );
  }

  return (
    <div
      className="user-menu"
      role="group"
      aria-label={`Signed in as ${user.name}`}
    >
      <Link className="user-menu-link" href="/account">
        Account
      </Link>
      <Link className="user-menu-link" href="/orders">
        Orders
      </Link>
      <form action={signOut}>
        <button className="user-menu-link user-menu-button" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
