import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const brevoEnv = {
  EMAIL_TRANSPORT: 'brevo',
  BREVO_API_KEY: 'test-api-key',
  EMAIL_FROM: 'FoodWise <signin@example.com>',
};

async function loadEmailModule() {
  vi.resetModules();
  return import('@/src/server/email');
}

beforeEach(() => {
  for (const [name, value] of Object.entries(brevoEnv)) {
    vi.stubEnv(name, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Brevo email transport', () => {
  it('sends a plain-text email through the Brevo API', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    await sendEmail({
      to: 'student@example.com',
      subject: 'Your FoodWise sign-in code',
      text: 'Your code is 123456.',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.brevo.com/v3/smtp/email'
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        'api-key': 'test-api-key',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const payload = z
      .object({
        sender: z.object({ name: z.string(), email: z.email() }),
        to: z.array(z.object({ email: z.email() })),
        subject: z.string(),
        textContent: z.string(),
      })
      .parse(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)));
    expect(payload).toEqual({
      sender: { name: 'FoodWise', email: 'signin@example.com' },
      to: [{ email: 'student@example.com' }],
      subject: 'Your FoodWise sign-in code',
      textContent: 'Your code is 123456.',
    });
  });

  it('fails explicitly if required credentials are absent', async () => {
    vi.stubEnv('BREVO_API_KEY', '');
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    await expect(
      sendEmail({ to: 'student@example.com', subject: 'Code', text: '123456' })
    ).rejects.toThrow('BREVO_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails without exposing provider response details when delivery fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response('sensitive provider details', { status: 401 })
        )
    );

    const { sendEmail } = await loadEmailModule();
    await expect(
      sendEmail({ to: 'student@example.com', subject: 'Code', text: '123456' })
    ).rejects.toThrow('Brevo rejected the email (HTTP 401).');
  });

  it('rejects an invalid configured sender before making a request', async () => {
    vi.stubEnv('EMAIL_FROM', 'not-an-email');
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    await expect(
      sendEmail({ to: 'student@example.com', subject: 'Code', text: '123456' })
    ).rejects.toThrow('EMAIL_FROM');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an unsupported transport instead of silently falling back', async () => {
    vi.stubEnv('EMAIL_TRANSPORT', 'unsupported');
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    await expect(
      sendEmail({ to: 'student@example.com', subject: 'Code', text: '123456' })
    ).rejects.toThrow('Unsupported EMAIL_TRANSPORT');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
