// The privacy notice a new account agrees to. Registration stores
// CONSENT_VERSION on the user, so change the version whenever this list or
// its wording changes.
export const CONSENT_VERSION = '2026-09-29';

export const COLLECTED_DATA = [
  {
    item: 'Your name',
    purpose: 'Shown to the vendor on your pickup orders.',
  },
  {
    item: 'Your email address',
    purpose:
      'Signs you in. For a school address, it also confirms you are a student.',
  },
  {
    item: 'Your country',
    purpose: 'Sets your default campus and how prices are formatted.',
  },
  {
    item: 'Sign-in records',
    purpose:
      'When you signed in and from which browser, to keep your account secure.',
  },
] as const;
