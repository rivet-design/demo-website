import { posthog } from './posthog';

// One-time code from the proxy. The page posts it so the proxy can identify
// this browser's anonymous PostHog id as the signed-in account. The code is a
// secret, and the account id never takes its place in the URL.

export const AUTH_PROXY_URL = 'https://rivet-proxy.onrender.com';

export type LinkCode = string & { readonly __brand: 'LinkCode' };

const AUTH_SUCCESS_PATH = '/auth-success';

const ANON_DISTINCT_ID_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;

/** Removes `link` before PostHog reads the address bar. */
export const takeLinkCode = (): LinkCode | null => {
  if (window.location.pathname !== AUTH_SUCCESS_PATH) return null;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('link')) return null;
  const raw = url.searchParams.get('link') ?? '';
  url.searchParams.delete('link');
  window.history.replaceState(window.history.state, '', url.toString());
  if (url.searchParams.get('login') !== 'complete' || raw.trim() === '') {
    return null;
  }
  return raw as LinkCode;
};

/**
 * Merges this anonymous browser into the signed-in account. A browser that
 * is already identified is left alone, so a shared machine never folds one
 * account into another.
 */
export const linkVisitor = (code: LinkCode): void => {
  try {
    if (!posthog.__loaded) return;
    if (posthog.get_property('$user_state') === 'identified') return;
    const anonDistinctId = posthog.get_distinct_id();
    if (!ANON_DISTINCT_ID_PATTERN.test(anonDistinctId)) return;
    fetch(`${AUTH_PROXY_URL}/api/auth/link-visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, anon_distinct_id: anonDistinctId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // posthog or fetch can throw when the SDK is blocked.
  }
};
