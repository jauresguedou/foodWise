import 'server-only';

export type OutgoingEmail = { to: string; subject: string; text: string };

type Transport = 'brevo' | 'resend' | 'console' | 'memory';

function getTransport(): Transport {
  const configured = process.env.EMAIL_TRANSPORT;
  if (
    configured === 'brevo' ||
    configured === 'resend' ||
    configured === 'console' ||
    configured === 'memory'
  ) {
    return configured;
  }
  if (configured) {
    throw new Error(`Unsupported EMAIL_TRANSPORT: ${configured}.`);
  }
  if (process.env.BREVO_API_KEY) return 'brevo';
  return process.env.RESEND_API_KEY ? 'resend' : 'console';
}

const memoryOutbox: OutgoingEmail[] = [];

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  switch (getTransport()) {
    case 'memory':
      memoryOutbox.push(email);
      return;
    case 'console':
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Email is not configured. Set a production email transport.'
        );
      }
      console.info(
        `\n[email] To: ${email.to}\n[email] ${email.subject}\n${email.text}\n`
      );
      return;
    case 'resend':
      await sendWithResend(email);
      return;
    case 'brevo':
      await sendWithBrevo(email);
      return;
  }
}

async function sendWithBrevo(email: OutgoingEmail): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const configuredFrom = process.env.EMAIL_FROM;
  if (!apiKey || !configuredFrom) {
    throw new Error('BREVO_API_KEY and EMAIL_FROM must both be set.');
  }
  const sender = parseSender(configuredFrom);
  if (!isEmailAddress(email.to)) {
    throw new Error('Brevo recipient must be a valid email address.');
  }
  if (/[\r\n]/.test(email.subject)) {
    throw new Error('Email subject cannot contain line breaks.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: email.to }],
      subject: email.subject,
      textContent: email.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Brevo rejected the email (HTTP ${response.status}).`);
  }
}

function isEmailAddress(value: string): boolean {
  return /^[^\s<>@]+@[^\s<>@]+$/.test(value);
}

function parseSender(value: string): { name?: string; email: string } {
  const match = /^(?:(.*?)\s*<([^<>]+)>|([^<>]+))$/.exec(value.trim());
  const name = match?.[1]?.trim();
  const email = (match?.[2] ?? match?.[3] ?? '').trim();
  if (
    !match ||
    !isEmailAddress(email) ||
    (name !== undefined && /[\r\n]/.test(name))
  ) {
    throw new Error(
      'EMAIL_FROM must be a valid email address or name and address.'
    );
  }
  return name ? { name, email } : { email };
}

async function sendWithResend(email: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM must both be set.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend rejected the email (HTTP ${response.status}).`);
  }
}

export function takeMemoryOutbox(): OutgoingEmail[] {
  return memoryOutbox.splice(0);
}
