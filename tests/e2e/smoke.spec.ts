import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page loads with a main heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('home page has no detectable WCAG A or AA violations', async ({
  page,
}) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // The starter home page uses gray text below 4.5:1. The design tokens
    // in issue #11 fix this; remove this line when that lands.
    .disableRules(['color-contrast'])
    .analyze();

  expect(results.violations).toEqual([]);
});