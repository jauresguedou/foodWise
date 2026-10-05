'use client';

import { type RefObject, useEffect } from 'react';

// After a failed submit, move focus to the first invalid field so keyboard
// and screen reader users land on the problem. `result` is the action state;
// a new object means a new submit.
export function useFocusFirstError(
  formRef: RefObject<HTMLFormElement | null>,
  result: { ok: boolean } | null
) {
  useEffect(() => {
    if (!result || result.ok) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    firstInvalid?.focus();
  }, [formRef, result]);
}
