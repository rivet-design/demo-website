import posthog, { type CaptureResult } from 'posthog-js';

const POSTHOG_PUBLIC_API_KEY = 'phc_Ntj9tXHbS64XgYxlTfhglRmFivFsfm0AERph4ZlnNH';
const POSTHOG_PUBLIC_HOST = 'https://us.i.posthog.com';

// The legacy implicit sign-in lands on /auth-success with Supabase tokens in
// the URL hash, and posthog-js copies the URL into $current_url and friends.
const TOKEN_FRAGMENT = /#\S*\b(?:access_token|refresh_token)=/;

const redact = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return TOKEN_FRAGMENT.test(value)
      ? value.slice(0, value.indexOf('#'))
      : value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, redact(v)]),
    );
  }
  return value;
};

export const redactAuthTokens = (
  event: CaptureResult | null,
): CaptureResult | null => event && (redact(event) as CaptureResult);

/**
 * Initialize PostHog with autocapture for the landing page
 */
export const initPostHog = (): void => {
  posthog.init(POSTHOG_PUBLIC_API_KEY, {
    api_host: POSTHOG_PUBLIC_HOST,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
    before_send: redactAuthTokens,
  });

  posthog.register({
    source: 'landing',
  });
};

export { posthog };
