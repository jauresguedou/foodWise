import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactElement } from 'react';
import { Resend } from 'resend';

// text is required: the terminal and test transports read it, and it is the
// fallback for clients that block HTML. react becomes the HTML body.
export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  react?: ReactElement;
};

const transports = ['brevo', 'resend', 'console', 'memory', 'file'] as const;
type Transport = (typeof transports)[number];

// EMAIL_TRANSPORT picks where email goes. An unknown value is an error, never
// a silent fallback. Without it: Brevo when BREVO_API_KEY is set, then Resend
// when RESEND_API_KEY is set, otherwise the dev server's terminal.
//   memory: integration tests read it with takeMemoryOutbox()
//   file:   end-to-end tests read JSON files from EMAIL_OUTBOX_DIR
function getTransport(): Transport {
  const configured = process.env.EMAIL_TRANSPORT;
  if (transports.some((transport) => transport === configured)) {
    return configured as Transport;
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
      // Sign-in codes must never land in production logs.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Email is not configured. Set a production email transport.'
        );
      }
      console.info(
        `\n[email] To: ${email.to}\n[email] ${email.subject}\n${email.text}\n`
      );
      return;
    case 'file':
      await writeToOutbox(email);
      return;
    case 'brevo':
      await sendWithBrevo(email);
      return;
    case 'resend':
      await sendWithResend(email);
      return;
  }
}

async function writeToOutbox(email: OutgoingEmail): Promise<void> {
  // Codes on disk are only acceptable on a test machine.
  if (process.env.VERCEL) {
    throw new Error('EMAIL_TRANSPORT=file is for local and CI tests only.');
  }
  const directory = process.env.EMAIL_OUTBOX_DIR;
  if (!directory) throw new Error('EMAIL_OUTBOX_DIR is not set.');

  await mkdir(directory, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.json`;
  // A React element does not serialize to JSON, so only the text goes to disk.
  const { to, subject, text } = email;
  await writeFile(
    path.join(directory, fileName),
    JSON.stringify({ to, subject, text })
  );
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

  // Brevo takes HTML as a string, so the React body is rendered here. Resend
  // takes the element itself. Loaded on demand: the other transports and the
  // text-only emails never need it.
  const htmlContent = email.react
    ? await (await import('@react-email/render')).render(email.react)
    : undefined;

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
      ...(htmlContent ? { htmlContent } : {}),
    }),
  });
  // The provider's response body can name the recipient, so only the status
  // goes into the error. That keeps addresses out of logs.
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

  // Created per send: the constructor throws when the key is missing, and the
  // other transports never need a key.
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: [email.to],
    subject: email.subject,
    text: email.text,
    react: email.react,
  });
  // Resend's message can name the recipient, so only the name and status go
  // into the error. That keeps addresses out of logs.
  if (error) {
    throw new Error(
      `Resend rejected the email (${error.name}, HTTP ${error.statusCode ?? 'n/a'}).`
    );
  }
}

// Tests only: returns and clears what the memory transport captured.
export function takeMemoryOutbox(): OutgoingEmail[] {
  return memoryOutbox.splice(0);
}
