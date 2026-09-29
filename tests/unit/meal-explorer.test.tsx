import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MealExplorer from '@/app/meal-explorer';
import type { Meal } from '@/app/page';

const baseMeal: Meal = {
  id: 'harvest-bowl',
  name: 'Harvest grain bowl',
  store: 'Juniper & Grain',
  neighborhood: 'North Campus',
  category: 'Bowls',
  price: 12.5,
  studentPrice: 8.95,
  available: 'Ready in 10-15 min',
  fulfillment: ['Pickup'],
  dietary: ['Vegetarian'],
  description: 'Roasted squash and farro.',
  accent: 'sage',
};

const meals: Meal[] = [
  baseMeal,
  {
    ...baseMeal,
    id: 'breakfast-wrap',
    name: 'Sunrise breakfast wrap',
    category: 'Breakfast',
    fulfillment: ['Pickup', 'Delivery'],
    dietary: [],
  },
];

describe('MealExplorer', () => {
  it('shows every meal before any filter is applied', () => {
    render(<MealExplorer meals={meals} />);

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('2 results')).toBeDefined();
  });

  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(<MealExplorer meals={meals} />);

    await user.type(screen.getByRole('textbox'), 'wrap');

    const results = screen.getAllByRole('article');
    expect(results).toHaveLength(1);
    expect(within(results[0]).getByRole('heading').textContent).toBe(
      'Sunrise breakfast wrap'
    );
  });

  it('offers a way out when nothing matches', async () => {
    const user = userEvent.setup();
    render(<MealExplorer meals={meals} />);

    await user.type(screen.getByRole('textbox'), 'sushi');
    expect(screen.queryAllByRole('article')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
