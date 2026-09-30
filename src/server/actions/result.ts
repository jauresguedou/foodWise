import { z } from 'zod';

// What every Server Action returns. Validation failures are results, not throws,
// so forms can show field errors with useActionState.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export function validationFailure(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    message: 'Check the highlighted fields and try again.',
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}
