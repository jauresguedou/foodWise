import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import {
  enterCode,
  readSignInCode,
  registerAndSignIn,
  uniqueEmail,
} from './helpers/auth';

// Full WCAG A and AA, including color contrast. Unlike the starter home page,
// every auth page must pass all of it.
async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe('registration', () => {
  test('a school email becomes a verified student', async ({ page }) => {
    const email = uniqueEmail();

    await registerAndSignIn(page, email, 'Ama Mensah');

    await expect(page).toHaveURL('/account');
    await expect(
      page.getByRole('heading', { name: 'Your account' })
    ).toBeVisible();
    const profile = page.getByRole('region', { name: 'Profile' });
    await expect(profile).toContainText(email);
    await expect(profile).toContainText('Ama Mensah');
    await expect(profile).toContainText(/Verified student since/);
    await expectNoAxeViolations(page);
  });

  test('a personal email signs in but is told how to verify', async ({
    page,
  }) => {
    await registerAndSignIn(page, uniqueEmail('example.com'));

    await expect(page.getByText('Not verified')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Get student prices' })
    ).toBeVisible();
    await expect(page.getByText(/@byupathway\.edu/).first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('shows what data is collected before asking for consent', async ({
    page,
  }) => {
    await page.goto('/register');

    const notice = page.getByRole('region', {
      name: 'What we collect and why',
    });
    await expect(notice).toContainText('Your email address');
    await expect(notice.getByLabel(/I agree/)).not.toBeChecked();
    await expectNoAxeViolations(page);
  });

  test('explains every problem and focuses the first one', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: 'Create account' }).click();

    const name = page.getByLabel('Your name');
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Enter your name.');
    await expect(page.getByLabel(/I agree/)).toHaveAccessibleDescription(
      /need to agree/
    );
    // Next.js adds its own role="alert" route announcer, so match the text.
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Check the highlighted fields' })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('keeps what was typed after a failed submit', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Your name').fill('Ama Mensah');
    await page.getByLabel('Email address').fill(uniqueEmail());

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByLabel(/I agree/)).toBeFocused();
    await expect(page.getByLabel('Your name')).toHaveValue('Ama Mensah');
  });
});

test.describe('signing in', () => {
  test('a wrong code is announced and focused, then the right one works', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerAndSignIn(page, email);
    await page.context().clearCookies();

    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await expect(
      page.getByRole('heading', { name: 'Check your email' })
    ).toBeVisible();
    await expectNoAxeViolations(page);

    await page.getByLabel('6-digit code').fill('000000');
    await page.getByRole('button', { name: 'Sign in' }).click();

    const code = page.getByLabel('6-digit code');
    await expect(code).toBeFocused();
    await expect(code).toHaveAttribute('aria-invalid', 'true');
    await expect(code).toHaveAccessibleDescription(/wrong or has expired/);

    await code.fill(await readSignInCode(email));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/account');
  });

  test('returns to the protected page that sent you to sign in', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerAndSignIn(page, email);
    await page.context().clearCookies();

    await page.goto('/account');

    await expect(page).toHaveURL('/login?callbackUrl=%2Faccount');
    await expectNoAxeViolations(page);
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await enterCode(page, email);
    await expect(page).toHaveURL('/account');
  });

  test('an unknown email gets the same reply as a real one', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.getByRole('button', { name: 'Email me a code' }).click();

    await expect(
      page.getByRole('heading', { name: 'Check your email' })
    ).toBeVisible();
    await expect(page.getByText(/If .* has a FoodWise account/)).toBeVisible();
  });

  test('the session cookie is HTTP-only and same-site', async ({ page }) => {
    await registerAndSignIn(page, uniqueEmail());

    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) =>
      cookie.name.includes('session_token')
    );
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
  });
});

test.describe('user menu', () => {
  test('signs in from the home page and signs out again', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    await registerAndSignIn(page, uniqueEmail(), 'Ama Mensah');
    await page.goto('/');
    await page.getByLabel('Account menu for Ama Mensah').click();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });
});

test.describe('keyboard only', () => {
  test('registers and signs in without a mouse', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');

    await page.getByLabel('Your name').focus();
    await page.keyboard.type('Ama Mensah');
    await page.keyboard.press('Tab');
    await page.keyboard.type(email);
    await page.keyboard.press('Tab'); // country: keep the default
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/I agree/)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');

    const submit = page.getByRole('button', { name: 'Create account' });
    await expect(submit).toBeFocused();
    // A visible focus ring, not just focus.
    expect(
      await submit.evaluate((element) => getComputedStyle(element).outlineStyle)
    ).toBe('solid');
    await page.keyboard.press('Enter');

    await expect(
      page.getByRole('heading', { name: 'Check your email' })
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('6-digit code')).toBeFocused();
    await page.keyboard.type(await readSignInCode(email));
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/account');
  });
});

test.describe('eligibility', () => {
  test('explains why an unverified student was sent to their account', async ({
    page,
  }) => {
    await registerAndSignIn(page, uniqueEmail('example.com'));

    await page.goto('/account?verification=required');

    await expect(
      page.getByRole('heading', { name: 'That page is for verified students' })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
