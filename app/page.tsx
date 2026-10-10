import MealExplorer from './meal-explorer';
import Link from 'next/link';
import { UserMenu } from '@/src/components/layout/UserMenu';




export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FoodWise home">
          <span className="brand-mark" aria-hidden="true">
            FW
          </span>
          <span>
            food<span>wise</span>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#discover">
            Discover
          </a>
          <Link href="/orders">Your orders</Link>
        </nav>
        <div className="header-actions">
          <Link className="workspace-switch" href="/vendor">
            Vendor workspace
          </Link>
          <UserMenu />
        </div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Good food. Better prices.</p>
          <h1>
            Find your next
            <br />
            <em>favorite meal.</em>
          </h1>
          <p className="hero-intro">
            Student-priced meals from the spots around campus, ready when you
            are.
          </p>
        </div>
        <div className="hero-note" aria-label="FoodWise promise">
          <span className="note-icon" aria-hidden="true">
            ✦
          </span>
          <p>
            <strong>Made for student budgets</strong>
            <br />
            Every price shown includes your student rate.
          </p>
        </div>
      </section>
      <MealExplorer />
    </main>
  );
}
