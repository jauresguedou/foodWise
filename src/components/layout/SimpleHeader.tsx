import Link from 'next/link';
import { UserMenu } from './UserMenu';

// The header for pages outside the home page, until SiteHeader (#12) replaces
// both. Reuses the home page's .site-header and .brand styles.
export function SimpleHeader({
  showUserMenu = true,
}: {
  showUserMenu?: boolean;
}) {
  return (
    <header className="site-header w-full">
      <Link className="brand" href="/" aria-label="FoodWise home">
        <span className="brand-mark" aria-hidden="true">
          FW
        </span>
        <span>
          food<span>wise</span>
        </span>
      </Link>
      {showUserMenu ? <UserMenu /> : null}
    </header>
  );
}
