'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { COLLECTED_DATA } from '@/src/auth/consent';
import {
  register,
  requestSignInCode,
  verifySignInCode,
} from '@/src/server/actions/auth';
import type { ActionResult } from '@/src/server/actions/result';
import type { CodeRequestResult } from '@/src/server/actions/auth';

type AuthFormProps = {
  mode: 'login' | 'register';
  callbackUrl: string;
};

type ResultWithFieldErrors =
  | { ok: true; data: unknown }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export function AuthForm({ mode, callbackUrl }: AuthFormProps) {
  const requestFormRef = useRef<HTMLFormElement>(null);
  const verifyFormRef = useRef<HTMLFormElement>(null);
  const requestAction = mode === 'register' ? register : requestSignInCode;
  const [requestState, submitRequest, isRequestPending] = useActionState<
    CodeRequestResult | null,
    FormData
  >(requestAction, null);
  const [verifyState, submitVerification, isVerifyPending] = useActionState<
    ActionResult | null,
    FormData
  >(verifySignInCode, null);

  useEffect(() => {
    focusFirstInvalidField(requestFormRef.current, requestState);
  }, [requestState]);

  useEffect(() => {
    focusFirstInvalidField(verifyFormRef.current, verifyState);
  }, [verifyState]);

  const email = requestState?.ok ? requestState.data.email : null;

  if (email) {
    const codeError =
      verifyState?.ok === false
        ? verifyState.fieldErrors?.code?.[0]
        : undefined;

    return (
      <section aria-labelledby="verify-heading">
        <h2 id="verify-heading">Check your email</h2>
        <p className="auth-intro">
          We sent a 6-digit sign-in code to <strong>{email}</strong>. It expires
          in 5 minutes.
        </p>
        {verifyState?.ok === false && (
          <p className="auth-error" role="alert" aria-live="assertive">
            {verifyState.message}
          </p>
        )}
        <form
          ref={verifyFormRef}
          action={submitVerification}
          className="auth-form"
        >
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? 'code-error' : undefined}
          />
          {codeError && (
            <p className="auth-field-error" id="code-error">
              {codeError}
            </p>
          )}
          <button type="submit" disabled={isVerifyPending}>
            {isVerifyPending ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>
        <button
          className="auth-text-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          Use a different email address
        </button>
      </section>
    );
  }

  const requestErrors =
    requestState?.ok === false ? requestState.fieldErrors : undefined;

  return (
    <section aria-labelledby="auth-heading">
      {requestState?.ok === false && (
        <p className="auth-error" role="alert" aria-live="assertive">
          {requestState.message}
        </p>
      )}
      <form ref={requestFormRef} action={submitRequest} className="auth-form">
        <h2 id="auth-heading">
          {mode === 'register' ? 'Create your account' : 'Sign in'}
        </h2>
        {mode === 'register' && (
          <>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              aria-invalid={Boolean(requestErrors?.name)}
              aria-describedby={requestErrors?.name ? 'name-error' : undefined}
            />
            <FieldError id="name-error" errors={requestErrors?.name} />
          </>
        )}

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          aria-invalid={Boolean(requestErrors?.email)}
          aria-describedby={requestErrors?.email ? 'email-error' : undefined}
        />
        <FieldError id="email-error" errors={requestErrors?.email} />

        {mode === 'register' && (
          <>
            <label htmlFor="countryCode">Country code</label>
            <input
              id="countryCode"
              name="countryCode"
              type="text"
              autoComplete="country"
              defaultValue="US"
              minLength={2}
              maxLength={2}
              pattern="[A-Za-z]{2}"
              required
              aria-invalid={Boolean(requestErrors?.countryCode)}
              aria-describedby={
                requestErrors?.countryCode ? 'country-error' : undefined
              }
            />
            <FieldError
              id="country-error"
              errors={requestErrors?.countryCode}
            />

            <fieldset
              className="consent-fieldset"
              aria-describedby={
                requestErrors?.consent ? 'consent-error' : undefined
              }
            >
              <legend>What FoodWise collects</legend>
              <ul>
                {COLLECTED_DATA.map(({ item, purpose }) => (
                  <li key={item}>
                    <strong>{item}:</strong> {purpose}
                  </li>
                ))}
              </ul>
              <label className="consent-label" htmlFor="consent">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  aria-invalid={Boolean(requestErrors?.consent)}
                  aria-describedby={
                    requestErrors?.consent ? 'consent-error' : undefined
                  }
                />
                I have read this notice and agree to create an account.
              </label>
              <FieldError id="consent-error" errors={requestErrors?.consent} />
            </fieldset>
          </>
        )}

        <button type="submit" disabled={isRequestPending}>
          {isRequestPending
            ? 'Sending code…'
            : mode === 'register'
              ? 'Create account and send code'
              : 'Email me a sign-in code'}
        </button>
      </form>
      <p className="auth-switch">
        {mode === 'register' ? 'Already have an account?' : 'New to FoodWise?'}{' '}
        <Link
          href={`/${mode === 'register' ? 'login' : 'register'}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          {mode === 'register' ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </section>
  );
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.[0]) return null;
  return (
    <p className="auth-field-error" id={id}>
      {errors[0]}
    </p>
  );
}

function focusFirstInvalidField(
  form: HTMLFormElement | null,
  result: ResultWithFieldErrors | null
) {
  if (!form || result?.ok !== false || !result.fieldErrors) return;
  const firstInvalidName = Object.keys(result.fieldErrors).find(
    (name) => result.fieldErrors?.[name]?.length
  );
  if (!firstInvalidName) return;
  const field = form.elements.namedItem(firstInvalidName);
  if (field instanceof HTMLElement) field.focus();
}
