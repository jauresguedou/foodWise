import Link from 'next/link';
import { getSession } from '@/src/auth/session';
import { signOut } from '@/src/server/actions/auth';

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

const menuItemClassName =
  'block w-full rounded-md px-3 py-2 text-left text-sm font-bold text-(--ink) hover:bg-(--cream) ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green)';

// Signed out: a sign-in link. Signed in: a disclosure (details/summary),
// which is keyboard operable and announced as expandable without any script.
export async function UserMenu() {
  const user = await getSession();

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center rounded-full border-2 border-(--green) px-4 text-sm font-bold text-(--green) hover:bg-(--cream) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green)"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="relative">
      {/* Own classes: the home page hides .profile-button on small screens. */}
      <summary
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-(--lime) text-xs font-extrabold text-(--green) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green) [&::-webkit-details-marker]:hidden"
        aria-label={`Account menu for ${user.name}`}
      >
        <span aria-hidden="true">{initials(user.name)}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-(--line) bg-white p-2 shadow-sm">
        <p className="truncate px-3 py-2 text-sm text-(--ink-soft)">
          {user.email}
        </p>
        <Link href="/account" className={menuItemClassName}>
          Your account
        </Link>
        <form action={signOut}>
          <button type="submit" className={menuItemClassName}>
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
