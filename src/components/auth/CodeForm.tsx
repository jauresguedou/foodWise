'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { TextField } from '@/src/components/shared/FormField';
import { StatusMessage } from '@/src/components/shared/StatusMessage';
import {
  buttonClassName,
  secondaryButtonClassName,
  textLinkClassName,
} from '@/src/components/shared/styles';
import { useFocusFirstError } from '@/src/components/shared/useFocusFirstError';
import { requestSignInCode, verifySignInCode } from '@/src/server/actions/auth';

type CodeFormProps = {
  email: string;
  callbackUrl?: string;
  onUseDifferentEmail: () => void;
};

// Step 2 of sign-in and registration: enter the code we emailed.
export function CodeForm({
  email,
  callbackUrl,
  onUseDifferentEmail,
}: CodeFormProps) {
  const [result, verifyAction, verifying] = useActionState(
    verifySignInCode,
    null
  );
  const [resendResult, resendAction, resending] = useActionState(
    requestSignInCode,
    null
  );
  const [code, setCode] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, result);

  // The page changed under the user; tell them where they are.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const codeErrors =
    result && !result.ok ? result.fieldErrors?.code : undefined;

  return (
    <section aria-labelledby="code-heading" className="space-y-5">
      <div>
        <h2
          id="code-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-extrabold text-(--ink) focus:outline-none"
        >
          Check your email
        </h2>
        <p className="mt-2 text-(--ink-soft)">
          If <strong className="text-(--ink)">{email}</strong> has a FoodWise
          account, we sent it a 6-digit code. It expires in 5 minutes.
        </p>
      </div>

      {result && !result.ok && !codeErrors ? (
        <StatusMessage tone="error">{result.message}</StatusMessage>
      ) : null}

      <form
        ref={formRef}
        action={verifyAction}
        aria-busy={verifying}
        className="space-y-4"
        noValidate
      >
        <input type="hidden" name="email" value={email} />
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}
        <TextField
          id="code"
          name="code"
          label="6-digit code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          errors={codeErrors}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          required
        />
        <button type="submit" className={buttonClassName} disabled={verifying}>
          {verifying ? 'Checking…' : 'Sign in'}
        </button>
      </form>

      <div className="space-y-3 border-t border-(--line) pt-5">
        {resendResult?.ok ? (
          <StatusMessage tone="success">We sent a new code.</StatusMessage>
        ) : null}
        {resendResult && !resendResult.ok ? (
          <StatusMessage tone="error">{resendResult.message}</StatusMessage>
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              className={secondaryButtonClassName}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Send a new code'}
            </button>
          </form>
          <button
            type="button"
            className={textLinkClassName}
            onClick={onUseDifferentEmail}
          >
            Use a different email
          </button>
        </div>
      </div>
    </section>
  );
}
