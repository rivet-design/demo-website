import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import AuthSuccessPage from '../components/AuthSuccessPage';
import { AUTH_PROXY_URL, linkVisitor, takeLinkCode } from './linkVisitor';
import { posthog, redactAuthTokens } from './posthog';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let sent: CaptureResult[] = [];

posthog.init('phc_test', {
  api_host: 'http://posthog.invalid',
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true,
  advanced_disable_flags: true,
  persistence: 'memory',
  before_send: [
    redactAuthTokens,
    (event) => {
      if (event) sent.push(event);
      return null;
    },
  ],
});

const ACCOUNT_ID = '0b9f3c2e-1d4a-4f6b-9e8d-7c6b5a4f3e2d';

const setUrl = (url: string) => window.history.replaceState(null, '', url);

const requireCode = () => {
  const code = takeLinkCode();
  if (!code) throw new Error('missing link code');
  return code;
};

let container: HTMLDivElement | undefined;
let root: Root | undefined;
let fetchMock: jest.Mock;

const renderAt = async (url: string) => {
  setUrl(url);
  container = document.createElement('div');
  document.body.appendChild(container);
  const next = createRoot(container);
  root = next;
  await act(async () => {
    next.render(createElement(AuthSuccessPage));
  });
};

beforeEach(() => {
  sent = [];
  posthog.reset();
  fetchMock = jest.fn().mockResolvedValue({ ok: true });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setUrl('/');
});

afterEach(() => {
  posthog.__loaded = true;
  if (root) {
    act(() => root?.unmount());
    root = undefined;
  }
  container?.remove();
  container = undefined;
  jest.restoreAllMocks();
});

describe('takeLinkCode and linkVisitor', () => {
  it('strips the link code before the pageview is captured', () => {
    setUrl('/auth-success?login=complete&ref=r_aZ09bY18&link=one-time-code');
    const code = takeLinkCode();
    posthog.capture('$pageview');

    expect(code).toBe('one-time-code');
    expect(window.location.href).toBe(
      'http://localhost/auth-success?login=complete&ref=r_aZ09bY18',
    );
    const pageview = sent.find((event) => event.event === '$pageview');
    expect(pageview?.properties.$current_url).toBe(
      'http://localhost/auth-success?login=complete&ref=r_aZ09bY18',
    );
    expect(JSON.stringify(sent)).not.toContain('one-time-code');
  });

  it('posts the code and the anonymous distinct id', () => {
    setUrl('/auth-success?login=complete&link=one-time-code');
    linkVisitor(requireCode());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        keepalive?: boolean;
      },
    ];
    expect(url).toBe(`${AUTH_PROXY_URL}/api/auth/link-visitor`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body ?? '')).toEqual({
      code: 'one-time-code',
      anon_distinct_id: posthog.get_distinct_id(),
    });
  });

  it('does not post when this browser is already identified', () => {
    posthog.identify(ACCOUNT_ID);
    fetchMock.mockClear();
    setUrl('/auth-success?login=complete&link=one-time-code');
    linkVisitor(requireCode());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a missing link',
      '/auth-success?login=complete',
      'http://localhost/auth-success?login=complete',
    ],
    [
      'an empty link',
      '/auth-success?login=complete&link=',
      'http://localhost/auth-success?login=complete',
    ],
    [
      'a blank link',
      '/auth-success?login=complete&link=%20',
      'http://localhost/auth-success?login=complete',
    ],
    [
      'a link on another path',
      '/download?login=complete&link=one-time-code',
      'http://localhost/download?login=complete&link=one-time-code',
    ],
    [
      'a link when login is not complete',
      '/auth-success?login=error&link=one-time-code',
      'http://localhost/auth-success?login=error',
    ],
  ])('returns null and does not post for %s', (_label, url, href) => {
    setUrl(url);
    const code = takeLinkCode();
    if (code) linkVisitor(code);
    expect(code).toBeNull();
    expect(window.location.href).toBe(href);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['with a space', 'has space'],
    ['empty', ''],
    ['longer than 200 characters', 'a'.repeat(201)],
  ])('does not post an anonymous id %s', (_label, anonId) => {
    jest.spyOn(posthog, 'get_distinct_id').mockReturnValue(anonId);
    setUrl('/auth-success?login=complete&link=one-time-code');
    linkVisitor(requireCode());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not post before posthog has loaded', () => {
    setUrl('/auth-success?login=complete&link=one-time-code');
    const code = requireCode();
    posthog.__loaded = false;
    linkVisitor(code);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still shows the signed-in page when the link request fails', async () => {
    const failingFetch = jest.fn().mockRejectedValue(new Error('offline'));
    globalThis.fetch = failingFetch as unknown as typeof fetch;
    setUrl('/auth-success?login=complete&link=one-time-code');
    linkVisitor(requireCode());

    await renderAt('/auth-success?login=complete');

    expect(failingFetch).toHaveBeenCalledTimes(1);
    expect(container?.textContent).toContain("You're signed in!");
  });

  it('does not throw when fetch throws synchronously', () => {
    setUrl('/auth-success?login=complete&link=one-time-code');
    const code = requireCode();
    globalThis.fetch = (() => {
      throw new Error('blocked');
    }) as typeof fetch;
    expect(() => linkVisitor(code)).not.toThrow();
  });

  it('does not throw when posthog throws', () => {
    setUrl('/auth-success?login=complete&link=one-time-code');
    const code = requireCode();
    jest.spyOn(posthog, 'get_property').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => linkVisitor(code)).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
