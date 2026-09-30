// Student eligibility rule (spec.md clarification, FR-002): an email address
// the student has proven they own, on a domain in STUDENT_EMAIL_DOMAINS.
// Pure functions, so they can be unit tested without a database.

export function parseStudentEmailDomains(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

export function getStudentEmailDomains(): string[] {
  return parseStudentEmailDomains(process.env.STUDENT_EMAIL_DOMAINS);
}

// Matches the domain itself and its subdomains: "byu.edu" allows
// "a@byu.edu" and "a@mail.byu.edu", but not "a@byu.edu.example.com".
export function isStudentEmail(
  email: string,
  allowedDomains: readonly string[]
): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1) return false;

  const domain = email.slice(at + 1).toLowerCase();
  return allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}
