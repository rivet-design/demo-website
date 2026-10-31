// The Rivet account id is the Supabase auth user id, a UUID. It is the only
// value /auth-success may pass to posthog.identify: never an email or token.

export type AccountId = string & { readonly __brand: 'AccountId' };

const ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The account id from a query-string value, or null when missing or malformed. */
export const parseAccountId = (raw: unknown): AccountId | null =>
  typeof raw === 'string' && ACCOUNT_ID_PATTERN.test(raw)
    ? (raw as AccountId)
    : null;

/**
 * The `sub` claim of a Supabase access token. The signature is not checked
 * here, so only call this after the proxy has accepted the token.
 */
export const accountIdFromAccessToken = (token: string): AccountId | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims: unknown = JSON.parse(atob(padded));
    return claims !== null && typeof claims === 'object' && 'sub' in claims
      ? parseAccountId(claims.sub)
      : null;
  } catch {
    return null;
  }
};
