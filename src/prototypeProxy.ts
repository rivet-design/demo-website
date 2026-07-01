const DEFAULT_PROTOTYPE_HOST_ORIGIN =
  'https://rivet-prototype-host.onrender.com';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

type ProxyEnv = Record<string, string | undefined>;
type HeaderValue = string | string[] | undefined;
export type ProxyHeaderMap = Record<string, HeaderValue>;
export type PrototypeProxyHeaders = Record<string, HeaderValue>;

const getConfiguredOrigin = (env: ProxyEnv): string => {
  return (
    env.RIVET_PROTOTYPE_HOST_URL?.trim() ||
    env.PROTOTYPE_HOST_ORIGIN?.trim() ||
    DEFAULT_PROTOTYPE_HOST_ORIGIN
  );
};

/**
 * Resolves the prototype host origin used by the landing service proxy.
 */
export const resolvePrototypeHostOrigin = (
  env: ProxyEnv = {},
): string => {
  const url = new URL(getConfiguredOrigin(env));
  return url.origin;
};

const getFirstHeaderValue = (value: HeaderValue): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const getFirstForwardedValue = (value: HeaderValue): string | null => {
  const firstValue = getFirstHeaderValue(value)?.split(',')[0]?.trim();
  return firstValue || null;
};

const getPublicHost = (headers: ProxyHeaderMap): string | null => {
  return (
    getFirstForwardedValue(headers['x-forwarded-host']) ??
    getFirstForwardedValue(headers.host)
  );
};

/**
 * Returns true when a request should be served by the prototype host.
 */
export const isPrototypeProxyRequest = (
  method: string | undefined,
  rawUrl: string | undefined,
): boolean => {
  const pathname = new URL(rawUrl ?? '/', 'https://rivet.design').pathname;
  const normalizedMethod = method?.toUpperCase();

  if (pathname === '/publish') {
    return normalizedMethod === 'POST';
  }

  if (pathname.startsWith('/share/') || pathname.startsWith('/p/')) {
    return normalizedMethod === 'GET';
  }

  return false;
};

/**
 * Returns true for headers that should not be forwarded by an HTTP proxy.
 */
export const isHopByHopHeader = (headerName: string): boolean => {
  return HOP_BY_HOP_HEADERS.has(headerName.toLowerCase());
};

/**
 * Builds upstream headers while preserving auth and public host context.
 */
export const createPrototypeProxyHeaders = (
  headers: ProxyHeaderMap,
  targetOrigin: string,
): PrototypeProxyHeaders => {
  const target = new URL(targetOrigin);
  const publicHost = getPublicHost(headers) ?? target.host;
  const proxyHeaders: PrototypeProxyHeaders = {};

  Object.entries(headers).forEach(([name, value]) => {
    if (isHopByHopHeader(name)) {
      return;
    }
    proxyHeaders[name] = value;
  });

  // The prototype host uses forwarded host context when constructing share URLs.
  proxyHeaders.host = publicHost;
  proxyHeaders['x-forwarded-host'] = publicHost;
  proxyHeaders['x-forwarded-proto'] =
    getFirstForwardedValue(headers['x-forwarded-proto']) ?? 'https';

  return proxyHeaders;
};
