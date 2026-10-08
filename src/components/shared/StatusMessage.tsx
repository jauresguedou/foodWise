import type { ReactNode } from 'react';

// Form-level feedback. An error uses role="alert" so it is announced as soon
// as it appears; success uses role="status", which waits politely.
export function StatusMessage({
  tone,
  children,
}: {
  tone: 'error' | 'success';
  children: ReactNode;
}) {
  const isError = tone === 'error';
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={
        isError
          ? 'rounded-lg border-2 border-(--danger) bg-white px-4 py-3 text-sm font-semibold text-(--danger)'
          : 'rounded-lg border-2 border-(--success) bg-white px-4 py-3 text-sm font-semibold text-(--success)'
      }
    >
      <span aria-hidden="true">{isError ? '! ' : '✓ '}</span>
      {children}
    </p>
  );
}
