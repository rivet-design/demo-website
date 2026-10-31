import posthog, { type CaptureResult } from 'posthog-js';
import { POSTHOG_PROXY_PATH, toPostHogProxyPath } from '../posthogProxy';

const POSTHOG_PUBLIC_API_KEY = 'phc_Ntj9tXHbS64XgYxlTfhglRmFivFsfm0AERph4ZlnNH';
const POSTHOG_UI_HOST = 'https://us.posthog.com';

// The legacy implicit sign-in lands on /auth-success with Supabase tokens in
// the URL hash, and posthog-js copies the URL into $current_url and friends.
const TOKEN_FRAGMENT = /#\S*\b(?:access_token|refresh_token)=/;

const AUTH_PAGE_PATH = '/auth-success';

// `session` pairs the browser with a pending proxy login, so it is as
// sensitive as a token for as long as that login is open.
const AUTH_PAGE_SECRET_PARAMS = [
  'session',
  'access_token',
  'refresh_token',
  'token',
  'code',
];

// /auth-success URLs lose their whole fragment and secret query params; the
// ref, login outcome, and account id stay so sign-ins remain attributable.
const sanitizeAuthPageUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (url.pathname !== AUTH_PAGE_PATH) return value;
  url.hash = '';
  for (const param of AUTH_PAGE_SECRET_PARAMS) url.searchParams.delete(param);
  return url.toString();
};

const redactString = (value: string): string => {
  const withoutTokens = TOKEN_FRAGMENT.test(value)
    ? value.slice(0, value.indexOf('#'))
    : value;
  return withoutTokens.includes(AUTH_PAGE_PATH)
    ? sanitizeAuthPageUrl(withoutTokens)
    : withoutTokens;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// Only plain objects and arrays are rebuilt; anything else (the event's Date
// timestamp included) passes through by reference.
const redact = (value: unknown): unknown => {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, redact(v)]),
    );
  }
  return value;
};

export const redactAuthTokens = (
  event: CaptureResult | null,
): CaptureResult | null => event && (redact(event) as CaptureResult);

// Every SDK request URL, including capture beacons and lazy-loaded scripts,
// comes from the router, so this is where blocklisted paths become aliases.
const routeThroughProxyAliases = (): void => {
  const router = posthog.requestRouter;
  const endpointFor = router.endpointFor.bind(router);
  router.endpointFor = (target, path) =>
    endpointFor(target, path && toPostHogProxyPath(path));
};

/**
 * Initialize PostHog with autocapture for the landing page
 */
export const initPostHog = (): void => {
  routeThroughProxyAliases();
  posthog.init(POSTHOG_PUBLIC_API_KEY, {
    api_host: POSTHOG_PROXY_PATH,
    ui_host: POSTHOG_UI_HOST,
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
