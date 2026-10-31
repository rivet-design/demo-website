import { isHopByHopHeader, type ProxyHeaderMap } from './prototypeProxy';

/**
 * First-party path the browser SDK uses instead of us.i.posthog.com. Ad
 * blockers match well-known analytics hosts and paths like /ingest or
 * /analytics, so this stays neutral.
 */
export const POSTHOG_PROXY_PATH = '/r8t';

const POSTHOG_API_HOST = 'us.i.posthog.com';
const POSTHOG_ASSET_HOST = 'us-assets.i.posthog.com';

// Edge and platform headers describe the hop into this service, not the
// browser, and would mislead PostHog if forwarded.
const STRIPPED_REQUEST_HEADERS = new Set([
  'cookie',
  'host',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-real-ip',
  'true-client-ip',
  'cdn-loop',
]);
const STRIPPED_REQUEST_HEADER_PREFIXES = ['cf-', 'rndr-', 'render-'];

type HeaderValue = ProxyHeaderMap[string];

const firstListValue = (value: HeaderValue): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim() || null;
};

/**
 * Maps a proxied request URL to its PostHog upstream, or null when the
 * request is not for the proxy path.
 */
export const resolvePostHogProxyTarget = (
  rawUrl: string | undefined,
): URL | null => {
  const url = new URL(rawUrl ?? '/', 'https://rivet.design');
  if (
    url.pathname !== POSTHOG_PROXY_PATH &&
    !url.pathname.startsWith(`${POSTHOG_PROXY_PATH}/`)
  ) {
    return null;
  }

  const pathname = url.pathname.slice(POSTHOG_PROXY_PATH.length) || '/';
  const host =
    pathname.startsWith('/static/') || pathname.startsWith('/array/')
      ? POSTHOG_ASSET_HOST
      : POSTHOG_API_HOST;
  return new URL(`${pathname}${url.search}`, `https://${host}`);
};

// PostHog geolocates whatever X-Forwarded-For says, so an internal peer
// address must not be forwarded as if it were the visitor's.
const PRIVATE_ADDRESS =
  /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|::1$|f[cd]|fe80:)/i;

/**
 * Returns the browser's IP. In production the socket peer is Render's load
 * balancer, so the Cloudflare- and Render-provided headers win.
 */
export const getPostHogClientIp = (
  headers: ProxyHeaderMap,
  socketAddress: string | undefined,
): string | null => {
  const forwarded =
    firstListValue(headers['cf-connecting-ip']) ??
    firstListValue(headers['x-forwarded-for']);
  if (forwarded) return forwarded;

  const peer = socketAddress?.replace(/^::ffff:/, '');
  return peer && !PRIVATE_ADDRESS.test(peer) ? peer : null;
};

/**
 * Builds upstream headers for PostHog: no cookies or foreign credentials, the
 * upstream's own Host, and the browser's IP so $geoip resolves the visitor.
 */
export const createPostHogProxyHeaders = (
  headers: ProxyHeaderMap,
  upstreamHost: string,
  clientIp: string | null,
): ProxyHeaderMap => {
  const proxyHeaders: ProxyHeaderMap = {};

  Object.entries(headers).forEach(([rawName, value]) => {
    const name = rawName.toLowerCase();
    if (
      isHopByHopHeader(name) ||
      STRIPPED_REQUEST_HEADERS.has(name) ||
      STRIPPED_REQUEST_HEADER_PREFIXES.some((prefix) => name.startsWith(prefix))
    ) {
      return;
    }
    proxyHeaders[name] = value;
  });

  const authorization = firstListValue(proxyHeaders.authorization);
  if (!authorization?.startsWith('Bearer phc_')) {
    delete proxyHeaders.authorization;
  }

  proxyHeaders.host = upstreamHost;
  const publicHost =
    firstListValue(headers['x-forwarded-host']) ?? firstListValue(headers.host);
  if (publicHost) {
    proxyHeaders['x-forwarded-host'] = publicHost;
  }
  proxyHeaders['x-forwarded-proto'] =
    firstListValue(headers['x-forwarded-proto']) ?? 'https';
  if (clientIp) {
    proxyHeaders['x-forwarded-for'] = clientIp;
    proxyHeaders['x-real-ip'] = clientIp;
  }

  return proxyHeaders;
};

/**
 * Returns true for upstream response headers that must not reach the browser.
 */
export const isStrippedPostHogResponseHeader = (name: string): boolean =>
  isHopByHopHeader(name) || name.toLowerCase() === 'set-cookie';
