import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { emailOutboxDir } from '../../../playwright.config';

// A fresh address per test, so tests can run in parallel and never hit
// another test's rate limits.
export function uniqueEmail(domain = 'byupathway.edu'): string {
  return `student-${randomUUID().slice(0, 8)}@${domain}`;
}

type SentEmail = { to: string; subject: string; text: string };

// Waits for the newest code emailed to this address.
export async function readSignInCode(email: string): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const files = await readdir(emailOutboxDir).catch(() => []);
        const messages = await Promise.all(
          files
            .sort()
            .map(
              async (file) =>
                JSON.parse(
                  await readFile(path.join(emailOutboxDir, file), 'utf8')
                ) as SentEmail
            )
        );
        code = messages
          .filter((message) => message.to === email)
          .at(-1)
          ?.text.match(/\b(\d{6})\b/)?.[1];
        return code;
      },
      { message: `waiting for a sign-in code for ${email}`, timeout: 10_000 }
    )
    .toBeTruthy();
  return code as string;
}

export async function registerAndSignIn(
  page: Page,
  email: string,
  name = 'Sam Student'
): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel(/I agree/).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await enterCode(page, email);
}

export async function enterCode(page: Page, email: string): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Check your email' })
  ).toBeVisible();
  await page.getByLabel('6-digit code').fill(await readSignInCode(email));
  await page.getByRole('button', { name: 'Sign in' }).click();
  // The session cookie arrives with the redirect; wait for it.
  await page.waitForURL(
    (url) => !['/login', '/register'].includes(url.pathname)
  );
}
