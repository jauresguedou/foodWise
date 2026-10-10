
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MealExplorer from '@/app/meal-explorer';

const baseMeal = {
  id: 'harvest-bowl',
  name: 'Harvest grain bowl',
  store: 'Juniper & Grain',
  neighborhood: 'North Campus',
  category: 'Bowls' as const,
  price: 12.5,
  studentPrice: 8.95,
  available: 'Ready in 10-15 min',
  fulfillment: ['Pickup'],
  dietary: ['Vegetarian'],
  description: 'Roasted squash and farro.',
  accent: 'sage',
};

const meals = [
  baseMeal,
  {
    ...baseMeal,
    id: 'breakfast-wrap',
    name: 'Sunrise breakfast wrap',
    category: 'Breakfast' as const,
    fulfillment: ['Pickup', 'Delivery'],
    dietary: [],
  },
];

function mockMealsApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ meals }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MealExplorer', () => {
  it('shows every meal before any filter is applied', async () => {
    mockMealsApi();

    render(<MealExplorer />);

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('2 results')).toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      '/api/meals',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('filters by search text', async () => {
    mockMealsApi();

    const user = userEvent.setup();
    render(<MealExplorer />);

    await screen.findByText('Harvest grain bowl');
    await user.type(screen.getByRole('textbox'), 'wrap');

    const results = screen.getAllByRole('article');

    expect(results).toHaveLength(1);
    expect(within(results[0]).getByRole('heading').textContent).toBe(
      'Sunrise breakfast wrap',
    );
  });

  it('offers a way out when nothing matches', async () => {
    mockMealsApi();

    const user = userEvent.setup();
    render(<MealExplorer />);

    await screen.findByText('Harvest grain bowl');
    await user.type(screen.getByRole('textbox'), 'sushi');

    expect(screen.queryAllByRole('article')).toHaveLength(0);

    await user.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );

    expect(await screen.findAllByRole('article')).toHaveLength(2);
  });
});
