import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type OutgoingEmail = { to: string; subject: string; text: string };

const transports = ['resend', 'console', 'memory', 'file'] as const;
type Transport = (typeof transports)[number];

// EMAIL_TRANSPORT picks where email goes. Without it: Resend when
// RESEND_API_KEY is set, otherwise the dev server's terminal.
//   memory: integration tests read it with takeMemoryOutbox()
//   file:   end-to-end tests read JSON files from EMAIL_OUTBOX_DIR
function getTransport(): Transport {
  const configured = process.env.EMAIL_TRANSPORT;
  if (transports.some((transport) => transport === configured)) {
    return configured as Transport;
  }
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
          'Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.'
        );
      }
      console.info(
        `\n[email] To: ${email.to}\n[email] ${email.subject}\n${email.text}\n`
      );
      return;
    case 'file':
      await writeToOutbox(email);
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
  await writeFile(path.join(directory, fileName), JSON.stringify(email));
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
  // The recipient stays out of the error, so it never reaches logs.
  if (!response.ok) {
    throw new Error(`Resend rejected the email (HTTP ${response.status}).`);
  }
}

// Tests only: returns and clears what the memory transport captured.
export function takeMemoryOutbox(): OutgoingEmail[] {
  return memoryOutbox.splice(0);
}
