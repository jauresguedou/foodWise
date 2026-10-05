import type { ComponentProps, ReactNode } from 'react';
import { inputClassName } from './styles';

// Ids for a field's hint and error, joined for aria-describedby.
export function describedBy(
  id: string,
  { hint, errors }: { hint?: ReactNode; errors?: string[] }
): string | undefined {
  const ids = [
    hint ? `${id}-hint` : null,
    errors?.length ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ');
  return ids || undefined;
}

export function FieldHint({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <p id={`${id}-hint`} className="mt-1 text-sm text-(--ink-soft)">
      {children}
    </p>
  );
}

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p
      id={`${id}-error`}
      className="mt-1 text-sm font-semibold text-(--danger)"
    >
      <span aria-hidden="true">! </span>
      {errors[0]}
    </p>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
} & Omit<ComponentProps<'input'>, 'id'>;

// Label above, input, then hint and error below, all linked for screen readers.
export function TextField({
  id,
  label,
  hint,
  errors,
  ...input
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-(--ink)">
        {label}
      </label>
      {hint ? <FieldHint id={id}>{hint}</FieldHint> : null}
      <input
        id={id}
        className={`mt-2 ${inputClassName}`}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, { hint, errors })}
        {...input}
      />
      <FieldError id={id} errors={errors} />
    </div>
  );
}
