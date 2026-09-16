import posthog from 'posthog-js';

const POSTHOG_PUBLIC_API_KEY = 'phc_Ntj9tXHbS64XgYxlTfhglRmFivFsfm0AERph4ZlnNH';
const POSTHOG_PUBLIC_HOST = 'https://us.i.posthog.com';

/**
 * Supabase's implicit OAuth flow lands on /auth-success with access and
 * refresh tokens in the URL fragment, which posthog-js would otherwise ship
 * inside $current_url, $referrer, and $initial_* person properties. Strip any
 * fragment carrying tokens from every string property (recursing into $set /
 * $set_once) so credentials never reach analytics.
 */
const stripTokenFragment = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const hashIndex = value.indexOf('#');
    if (hashIndex !== -1 && value.includes('access_token')) {
      return value.slice(0, hashIndex);
    }
    return value;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        stripTokenFragment(nested),
      ]),
    );
  }
  return value;
};

/**
 * Initialize PostHog with autocapture for the landing page
 */
export const initPostHog = (): void => {
  posthog.init(POSTHOG_PUBLIC_API_KEY, {
    api_host: POSTHOG_PUBLIC_HOST,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
    sanitize_properties: (properties) =>
      stripTokenFragment(properties) as typeof properties,
  });

  posthog.register({
    source: 'landing',
  });
};

export { posthog };
