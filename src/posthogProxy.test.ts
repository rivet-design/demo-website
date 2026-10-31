import {
  POSTHOG_PROXY_PATH,
  createPostHogProxyHeaders,
  getPostHogClientIp,
  isStrippedPostHogResponseHeader,
  resolvePostHogProxyTarget,
  toPostHogProxyPath,
} from './posthogProxy';

describe('posthog proxy', () => {
  describe('resolvePostHogProxyTarget', () => {
    it('ignores requests outside the proxy path', () => {
      expect(resolvePostHogProxyTarget('/')).toBeNull();
      expect(resolvePostHogProxyTarget('/download')).toBeNull();
      expect(resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}x/e/`)).toBeNull();
    });

    it('sends capture, flags, and replay to the API host with the query', () => {
      expect(
        resolvePostHogProxyTarget(
          `${POSTHOG_PROXY_PATH}/e/?ip=0&_=1&ver=1.304.0&compression=gzip-js`,
        )?.href,
      ).toBe(
        'https://us.i.posthog.com/e/?ip=0&_=1&ver=1.304.0&compression=gzip-js',
      );
      expect(
        resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}/flags/?v=2`)?.href,
      ).toBe('https://us.i.posthog.com/flags/?v=2');
      expect(resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}/s/`)?.href).toBe(
        'https://us.i.posthog.com/s/',
      );
    });

    it('never lets the path choose another upstream host', () => {
      [
        `${POSTHOG_PROXY_PATH}//example.com/anything`,
        `${POSTHOG_PROXY_PATH}//127.0.0.1:8443/private`,
        `${POSTHOG_PROXY_PATH}/\\example.com/x`,
      ].forEach((rawUrl) => {
        const target = resolvePostHogProxyTarget(rawUrl);
        expect(target?.origin).toBe('https://us.i.posthog.com');
      });
      expect(
        resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}//example.com/anything`)
          ?.pathname,
      ).toBe('//example.com/anything');
    });

    it('maps blocklisted path aliases back to their PostHog paths', () => {
      expect(
        resolvePostHogProxyTarget(
          `${POSTHOG_PROXY_PATH}/k/?ip=0&compression=gzip-js&beacon=1`,
        )?.href,
      ).toBe('https://us.i.posthog.com/e/?ip=0&compression=gzip-js&beacon=1');
      expect(
        resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}/i/v0/k/?ip=0`)?.href,
      ).toBe('https://us.i.posthog.com/i/v0/e/?ip=0');
      expect(
        resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}/static/rr.js?v=1`)
          ?.href,
      ).toBe('https://us-assets.i.posthog.com/static/posthog-recorder.js?v=1');
    });

    it('sends SDK assets and remote config to the asset host', () => {
      expect(
        resolvePostHogProxyTarget(
          `${POSTHOG_PROXY_PATH}/static/recorder.js?v=1.304.0`,
        )?.href,
      ).toBe('https://us-assets.i.posthog.com/static/recorder.js?v=1.304.0');
      expect(
        resolvePostHogProxyTarget(`${POSTHOG_PROXY_PATH}/array/phc_x/config.js`)
          ?.href,
      ).toBe('https://us-assets.i.posthog.com/array/phc_x/config.js');
    });
  });

  describe('toPostHogProxyPath', () => {
    it('aliases blocklisted SDK paths and keeps their query', () => {
      expect(toPostHogProxyPath('/e/')).toBe('/k/');
      expect(toPostHogProxyPath('/i/v0/e/')).toBe('/i/v0/k/');
      expect(toPostHogProxyPath('/static/posthog-recorder.js?v=1.363.5')).toBe(
        '/static/rr.js?v=1.363.5',
      );
    });

    it('leaves every other path alone', () => {
      ['/flags/?v=2', '/s/', '/static/surveys.js?v=1', '/e/extra'].forEach(
        (path) => expect(toPostHogProxyPath(path)).toBe(path),
      );
    });
  });

  describe('getPostHogClientIp', () => {
    it('prefers the Cloudflare visitor IP', () => {
      expect(
        getPostHogClientIp(
          {
            'cf-connecting-ip': '203.0.113.7',
            'x-forwarded-for': '198.51.100.1, 10.0.0.1',
          },
          '10.1.2.3',
        ),
      ).toBe('203.0.113.7');
    });

    it('falls back to the first X-Forwarded-For hop, then the socket', () => {
      expect(
        getPostHogClientIp(
          { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
          '10.1.2.3',
        ),
      ).toBe('198.51.100.1');
      expect(getPostHogClientIp({}, '::ffff:198.51.100.9')).toBe(
        '198.51.100.9',
      );
      expect(getPostHogClientIp({}, undefined)).toBeNull();
    });

    it('does not report a loopback or private peer as the visitor', () => {
      [
        '::ffff:127.0.0.1',
        '::1',
        '10.4.0.2',
        '172.20.1.1',
        '192.168.0.5',
      ].forEach((peer) => expect(getPostHogClientIp({}, peer)).toBeNull());
      expect(getPostHogClientIp({}, '172.32.0.1')).toBe('172.32.0.1');
    });
  });

  describe('createPostHogProxyHeaders', () => {
    it('forwards the browser IP and public host without edge or cookie headers', () => {
      const headers = createPostHogProxyHeaders(
        {
          host: 'rivet.design',
          'content-type': 'text/plain',
          'user-agent': 'Mozilla/5.0',
          origin: 'https://rivet.design',
          cookie: 'sb-access-token=secret',
          connection: 'keep-alive',
          'cf-connecting-ip': '203.0.113.7',
          'cf-ray': 'abc',
          'cf-ipcountry': 'US',
          'cdn-loop': 'cloudflare',
          'rndr-id': 'r1',
          'true-client-ip': '203.0.113.7',
          'x-forwarded-for': '203.0.113.7, 10.0.0.1',
          'x-forwarded-proto': 'https',
        },
        'us.i.posthog.com',
        '203.0.113.7',
      );

      expect(headers).toEqual({
        host: 'us.i.posthog.com',
        'content-type': 'text/plain',
        'user-agent': 'Mozilla/5.0',
        origin: 'https://rivet.design',
        'x-forwarded-host': 'rivet.design',
        'x-forwarded-proto': 'https',
        'x-forwarded-for': '203.0.113.7',
        'x-real-ip': '203.0.113.7',
      });
    });

    it('keeps only project-token authorization', () => {
      expect(
        createPostHogProxyHeaders(
          { authorization: 'Bearer phc_abc' },
          'us.i.posthog.com',
          null,
        ).authorization,
      ).toBe('Bearer phc_abc');
      expect(
        createPostHogProxyHeaders(
          { authorization: 'Bearer eyJhbGciOi' },
          'us.i.posthog.com',
          null,
        ),
      ).not.toHaveProperty('authorization');
    });
  });

  it('drops hop-by-hop and cookie-setting response headers', () => {
    expect(isStrippedPostHogResponseHeader('Set-Cookie')).toBe(true);
    expect(isStrippedPostHogResponseHeader('transfer-encoding')).toBe(true);
    expect(isStrippedPostHogResponseHeader('content-encoding')).toBe(false);
    expect(isStrippedPostHogResponseHeader('cache-control')).toBe(false);
  });
});
