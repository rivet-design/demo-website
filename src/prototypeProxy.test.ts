import {
  createPrototypeProxyHeaders,
  isPrototypeProxyRequest,
  isProxyLoopRequest,
  resolvePrototypeHostOrigin,
} from './prototypeProxy';

describe('prototype proxy', () => {
  describe('resolvePrototypeHostOrigin', () => {
    it('defaults to the production prototype host', () => {
      expect(resolvePrototypeHostOrigin({})).toBe(
        'https://rivet-prototype-host.onrender.com',
      );
    });

    it('uses RIVET_PROTOTYPE_HOST_URL when configured', () => {
      expect(
        resolvePrototypeHostOrigin({
          RIVET_PROTOTYPE_HOST_URL: 'https://preview.example.com/path/',
          PROTOTYPE_HOST_ORIGIN: 'https://fallback.example.com',
        }),
      ).toBe('https://preview.example.com');
    });

    it('falls back to PROTOTYPE_HOST_ORIGIN', () => {
      expect(
        resolvePrototypeHostOrigin({
          RIVET_PROTOTYPE_HOST_URL: '  ',
          PROTOTYPE_HOST_ORIGIN: 'https://fallback.example.com/',
        }),
      ).toBe('https://fallback.example.com');
    });
  });

  describe('isPrototypeProxyRequest', () => {
    it('matches POST /publish', () => {
      expect(isPrototypeProxyRequest('POST', '/publish')).toBe(true);
      expect(isPrototypeProxyRequest('POST', '/publish?title=Demo')).toBe(true);
    });

    it('does not match non-publish methods', () => {
      expect(isPrototypeProxyRequest('GET', '/publish')).toBe(false);
    });

    it('matches share and prototype GET routes', () => {
      expect(isPrototypeProxyRequest('GET', '/share/demo')).toBe(true);
      expect(isPrototypeProxyRequest('GET', '/share/demo/assets/app.js')).toBe(
        true,
      );
      expect(isPrototypeProxyRequest('GET', '/p/demo/nested/route')).toBe(true);
    });

    it('does not match nearby landing routes', () => {
      expect(isPrototypeProxyRequest('GET', '/share')).toBe(false);
      expect(isPrototypeProxyRequest('GET', '/shared/demo')).toBe(false);
      expect(isPrototypeProxyRequest('GET', '/pricing')).toBe(false);
    });
  });

  describe('createPrototypeProxyHeaders', () => {
    it('targets the upstream host and forwards the browser-visible host', () => {
      const headers = createPrototypeProxyHeaders(
        {
          authorization: 'Bearer token',
          connection: 'keep-alive',
          host: 'rivet.design',
          'content-type': 'application/json',
        },
        'https://rivet-prototype-host.onrender.com',
      );

      expect(headers.authorization).toBe('Bearer token');
      expect(headers.connection).toBeUndefined();
      expect(headers.host).toBe('rivet-prototype-host.onrender.com');
      expect(headers['x-forwarded-host']).toBe('rivet.design');
      expect(headers['x-forwarded-proto']).toBe('https');
      expect(headers['content-type']).toBe('application/json');
    });

    it('prefers an existing forwarded host from the frontend edge', () => {
      const headers = createPrototypeProxyHeaders(
        {
          host: 'rivet-frontend.onrender.com',
          'x-forwarded-host': 'rivet.design, internal.render.com',
          'x-forwarded-proto': 'https',
        },
        'https://rivet-prototype-host.onrender.com',
      );

      expect(headers.host).toBe('rivet-prototype-host.onrender.com');
      expect(headers['x-forwarded-host']).toBe('rivet.design');
    });
  });

  describe('isProxyLoopRequest', () => {
    it('detects an upstream that matches the request host', () => {
      expect(
        isProxyLoopRequest({ host: 'rivet.design' }, 'https://rivet.design'),
      ).toBe(true);
    });

    it('detects an upstream that matches the forwarded host', () => {
      expect(
        isProxyLoopRequest(
          {
            host: 'rivet-frontend.onrender.com',
            'x-forwarded-host': 'rivet.design',
          },
          'https://rivet.design',
        ),
      ).toBe(true);
    });

    it('allows a distinct upstream host', () => {
      expect(
        isProxyLoopRequest(
          { host: 'rivet.design' },
          'https://rivet-prototype-host.onrender.com',
        ),
      ).toBe(false);
    });
  });
});
