// Only follow same-site paths after sign-in, so a crafted link like
// /login?callbackUrl=https://evil.example cannot bounce users off-site.
export function safeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = '/account'
): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith('/')) return fallback;
  // "//host" and "/\host" are protocol-relative URLs to another site.
  if (callbackUrl.startsWith('//') || callbackUrl.startsWith('/\\')) {
    return fallback;
  }
  return callbackUrl;
}
