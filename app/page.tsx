import MealExplorer from './meal-explorer';

export type Meal = {
  id: string;
  name: string;
  store: string;
  neighborhood: string;
  category: 'Bowls' | 'Sandwiches' | 'Vegetarian' | 'Breakfast';
  price: number;
  studentPrice: number;
  available: string;
  fulfillment: string[];
  dietary: string[];
  description: string;
  accent: string;
};

const meals: Meal[] = [
  {
    id: 'harvest-bowl',
    name: 'Harvest grain bowl',
    store: 'Juniper & Grain',
    neighborhood: 'North Campus',
    category: 'Bowls',
    price: 12.5,
    studentPrice: 8.95,
    available: 'Ready in 10-15 min',
    fulfillment: ['Pickup', 'Delivery'],
    dietary: ['Vegetarian', 'Gluten-free'],
    description: 'Roasted squash, farro, greens, pepitas, and lemon tahini.',
    accent: 'sage',
  },
  {
    id: 'sunrise-breakfast',
    name: 'Sunrise breakfast wrap',
    store: 'The Daily Table',
    neighborhood: 'Library District',
    category: 'Breakfast',
    price: 9.75,
    studentPrice: 6.5,
    available: 'Ready in 5-10 min',
    fulfillment: ['Pickup'],
    dietary: ['Vegetarian'],
    description:
      'Eggs, cheddar, black beans, roasted salsa, and avocado crema.',
    accent: 'gold',
  },
  {
    id: 'spicy-chicken',
    name: 'Spicy chicken banh mi',
    store: 'Lantern Kitchen',
    neighborhood: 'East Village',
    category: 'Sandwiches',
    price: 11.25,
    studentPrice: 7.99,
    available: 'Ready in 15-20 min',
    fulfillment: ['Pickup', 'Delivery'],
    dietary: [],
    description:
      'Lemongrass chicken, pickled vegetables, cucumber, and chili mayo.',
    accent: 'coral',
  },
  {
    id: 'green-pasta',
    name: 'Green goddess pasta',
    store: 'Olive & Rye',
    neighborhood: 'West End',
    category: 'Vegetarian',
    price: 13,
    studentPrice: 8.5,
    available: 'Ready in 20-25 min',
    fulfillment: ['Pickup', 'Delivery'],
    dietary: ['Vegetarian', 'Contains dairy'],
    description:
      'Basil pesto, broccoli, peas, parmesan, and toasted breadcrumbs.',
    accent: 'mint',
  },
];

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
          <a href="#orders">Your orders</a>
        </nav>
        <button
          className="profile-button"
          type="button"
          aria-label="Open profile menu"
        >
          JS
        </button>
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
      <MealExplorer meals={meals} />
    </main>
  );
}
