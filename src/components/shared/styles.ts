// Shared Tailwind classes for forms. Colors come from the CSS variables in
// app/globals.css until the design tokens in #11 replace them.

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--green)';

export const inputClassName =
  'block min-h-11 w-full rounded-lg border border-(--field-border) bg-white px-3 py-2 text-base text-(--ink) ' +
  'aria-invalid:border-2 aria-invalid:border-(--danger) ' +
  focusRing;

export const buttonClassName =
  'inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-(--green) px-5 py-2 text-base font-bold text-white sm:w-auto ' +
  'hover:bg-(--green-hover) disabled:cursor-not-allowed disabled:opacity-70 ' +
  focusRing;

export const secondaryButtonClassName =
  'inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-(--green) bg-white px-4 py-2 text-sm font-bold text-(--green) ' +
  'hover:bg-(--cream) disabled:cursor-not-allowed disabled:opacity-70 ' +
  focusRing;

export const textLinkClassName =
  'rounded-sm font-bold text-(--green) underline underline-offset-4 hover:no-underline ' +
  focusRing;
