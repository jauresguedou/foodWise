'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { TextField } from '@/src/components/shared/FormField';
import { StatusMessage } from '@/src/components/shared/StatusMessage';
import { buttonClassName } from '@/src/components/shared/styles';
import { useFocusFirstError } from '@/src/components/shared/useFocusFirstError';
import {
  type CodeRequestResult,
  requestSignInCode,
} from '@/src/server/actions/auth';
import { CodeForm } from './CodeForm';

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [result, action, pending] = useActionState(requestSignInCode, null);
  const [email, setEmail] = useState('');
  // Going back to the email step hides this result without a new submit.
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

  return (
    <form
      ref={formRef}
      action={action}
      aria-busy={pending}
      className="space-y-5"
      noValidate
    >
      {errors && !errors.fieldErrors ? (
        <StatusMessage tone="error">{errors.message}</StatusMessage>
      ) : null}
      <TextField
        ref={emailRef}
        id="email"
        name="email"
        type="email"
        label="Email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        errors={errors?.fieldErrors?.email}
        autoComplete="email"
        required
      />
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? 'Sending…' : 'Email me a code'}
      </button>
    </form>
  );
}
