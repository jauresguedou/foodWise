'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { COLLECTED_DATA } from '@/src/auth/consent';
import {
  describedBy,
  FieldError,
  FieldHint,
  TextField,
} from '@/src/components/shared/FormField';
import { StatusMessage } from '@/src/components/shared/StatusMessage';
import {
  buttonClassName,
  inputClassName,
} from '@/src/components/shared/styles';
import { useFocusFirstError } from '@/src/components/shared/useFocusFirstError';
import type { CountryOption } from '@/src/lib/countries';
import { type CodeRequestResult, register } from '@/src/server/actions/auth';
import { CodeForm } from './CodeForm';

type RegisterFormProps = {
  countries: CountryOption[];
  studentDomains: string[];
  callbackUrl?: string;
};

export function RegisterForm({
  countries,
  studentDomains,
  callbackUrl,
}: RegisterFormProps) {
  const [result, action, pending] = useActionState(register, null);
  // Controlled fields, so a failed submit keeps what the student typed.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [consent, setConsent] = useState(false);
  const [dismissed, setDismissed] = useState<CodeRequestResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  useFocusFirstError(formRef, result);

  useEffect(() => {
    if (dismissed) emailRef.current?.focus();
  }, [dismissed]);

  if (result?.ok && result !== dismissed) {
    return (
      <CodeForm
        email={result.data.email}
        callbackUrl={callbackUrl}
        onUseDifferentEmail={() => setDismissed(result)}
      />
    );
  }

  const errors = result && !result.ok && result !== dismissed ? result : null;
  const fieldErrors = errors?.fieldErrors;
  const domainList = studentDomains.map((domain) => `@${domain}`).join(' or ');

  return (
    <form
      ref={formRef}
      action={action}
      aria-busy={pending}
      className="space-y-5"
      noValidate
    >
      {errors ? (
        <StatusMessage tone="error">{errors.message}</StatusMessage>
      ) : null}

      <TextField
        id="name"
        name="name"
        label="Your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        errors={fieldErrors?.name}
        autoComplete="name"
        maxLength={100}
        required
      />

      <TextField
        ref={emailRef}
        id="email"
        name="email"
        type="email"
        label="Email address"
        hint={
          domainList
            ? `Use your school address (${domainList}) to get student prices.`
            : undefined
        }
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        errors={fieldErrors?.email}
        autoComplete="email"
        required
      />

      <div>
        <label
          htmlFor="countryCode"
          className="block text-sm font-bold text-(--ink)"
        >
          Country
        </label>
        <FieldHint id="countryCode">
          Sets your default campus and how prices are shown.
        </FieldHint>
        <select
          id="countryCode"
          name="countryCode"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className={`mt-2 ${inputClassName}`}
          aria-invalid={fieldErrors?.countryCode ? true : undefined}
          aria-describedby={describedBy('countryCode', {
            hint: true,
            errors: fieldErrors?.countryCode,
          })}
          autoComplete="country"
          required
        >
          {countries.map(({ code, name: countryName }) => (
            <option key={code} value={code}>
              {countryName}
            </option>
          ))}
        </select>
        <FieldError id="countryCode" errors={fieldErrors?.countryCode} />
      </div>

      <section
        aria-labelledby="privacy-heading"
        className="rounded-xl border border-(--line) bg-white p-4"
      >
        <h2 id="privacy-heading" className="text-base font-extrabold">
          What we collect and why
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-(--ink-soft)">
          {COLLECTED_DATA.map(({ item, purpose }) => (
            <li key={item}>
              <strong className="text-(--ink)">{item}:</strong> {purpose}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-(--ink-soft)">
          FoodWise has no passwords: you sign in with a code we email you.
        </p>

        <div className="mt-4 flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 size-6 shrink-0 accent-(--green) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green)"
            aria-invalid={fieldErrors?.consent ? true : undefined}
            aria-describedby={describedBy('consent', {
              errors: fieldErrors?.consent,
            })}
            required
          />
          <label htmlFor="consent" className="text-sm font-bold text-(--ink)">
            I agree to FoodWise collecting and using this information as
            described above.
          </label>
        </div>
        <FieldError id="consent" errors={fieldErrors?.consent} />
      </section>

      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? 'Sending…' : 'Create account'}
      </button>
    </form>
  );
}
