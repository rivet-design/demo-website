import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog, redactAuthTokens } from '../lib/posthog';
import AuthSuccessPage from './AuthSuccessPage';

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

const customEvents = () =>
  sent
    .filter((e) => e.event.startsWith('editor_sign_in') || e.event === '$set')
    .map((e) => ({
      event: e.event,
      auth_flow: e.properties.auth_flow,
      reason: e.properties.reason,
      install_ref: e.properties.install_ref,
      $set: e.properties.$set,
      $set_once: e.properties.$set_once,
    }));

let container: HTMLDivElement;
let root: Root;

const renderAt = async (url: string) => {
  window.history.replaceState(null, '', url);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<AuthSuccessPage />);
  });
};

beforeEach(() => {
  sent = [];
  posthog.reset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

describe('AuthSuccessPage telemetry', () => {
  it('marks the person installed on a PKCE sign-in', async () => {
    await renderAt('/auth-success?login=complete');

    expect(container.textContent).toContain("You're signed in!");
    const events = customEvents();
    expect(events.map((e) => e.event)).toEqual([
      '$set',
      'editor_sign_in_completed',
    ]);
    expect(events[0].$set).toEqual({ rivet_installed: true });
    expect(events[0].$set_once).toEqual({
      rivet_first_installed_at: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
    expect(events[1].auth_flow).toBe('pkce');
    expect('install_ref' in sent[sent.length - 1].properties).toBe(false);
  });

  it('reports the CLI-carried ref and shares it with the person', async () => {
    await renderAt('/auth-success?login=complete&ref=r_aZ09bY18');

    expect(container.textContent).toContain("You're signed in!");
    const events = customEvents();
    expect(events.map((e) => e.event)).toEqual([
      '$set',
      'editor_sign_in_completed',
    ]);
    expect(events[0].$set).toEqual({
      rivet_installed: true,
      last_install_ref: 'r_aZ09bY18',
    });
    expect(events[1]).toMatchObject({
      auth_flow: 'pkce',
      install_ref: 'r_aZ09bY18',
    });
    expect(sent[sent.length - 1].properties.$current_url).toBe(
      'http://localhost/auth-success?login=complete&ref=r_aZ09bY18',
    );
  });

  it.each([
    ['malformed', 'r_short'],
    ['injected', 'r_aZ09bY18%22%3E'],
    ['empty', ''],
  ])('ignores a %s ref', async (_, ref) => {
    await renderAt(`/auth-success?login=complete&ref=${ref}`);

    expect(container.textContent).toContain("You're signed in!");
    const events = customEvents();
    expect(events[0].$set).toEqual({ rivet_installed: true });
    expect(events[1].event).toBe('editor_sign_in_completed');
    expect('install_ref' in sent[sent.length - 1].properties).toBe(false);
  });

  it('carries the ref on a failed sign-in without touching the person', async () => {
    await renderAt('/auth-success?login=error&reason=internal&ref=r_aZ09bY18');

    expect(customEvents()).toEqual([
      {
        event: 'editor_sign_in_failed',
        auth_flow: 'pkce',
        reason: 'internal',
        install_ref: 'r_aZ09bY18',
        $set: undefined,
        $set_once: undefined,
      },
    ]);
  });

  describe('editor sign-in: ?session=&ref= with a token fragment', () => {
    const EDITOR_URL =
      '/auth-success?session=sess-9&ref=r_aZ09bY18#access_token=secret-access&refresh_token=secret-refresh&expires_in=3600&token_type=bearer';
    const KEPT_URL =
      'http://localhost/auth-success?session=sess-9&ref=r_aZ09bY18';

    const mockProxy = (response: unknown) => {
      const fetchMock = jest.fn().mockResolvedValue(response);
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      return fetchMock;
    };

    // The real page also autocaptures a pageview carrying every URL property.
    const capturePageview = () => posthog.capture('$pageview');

    const urlProps = (event: CaptureResult) =>
      Object.fromEntries(
        Object.entries(event.properties).filter(
          ([key, value]) => typeof value === 'string' && value.includes('://'),
        ),
      );

    const expectNoTokens = () => {
      const payload = JSON.stringify(sent);
      expect(payload).not.toContain('secret-access');
      expect(payload).not.toContain('secret-refresh');
      expect(payload).not.toContain('access_token');
    };

    it('relays the tokens and reports the ref on success', async () => {
      const fetchMock = mockProxy({
        ok: true,
        json: async () => ({ success: true }),
      });

      await renderAt(EDITOR_URL);
      capturePageview();

      expect(container.textContent).toContain("You're signed in!");
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        sessionId: 'sess-9',
        accessToken: 'secret-access',
        refreshToken: 'secret-refresh',
      });
      const events = customEvents();
      expect(events.map((e) => [e.event, e.auth_flow, e.install_ref])).toEqual([
        ['$set', undefined, undefined],
        ['editor_sign_in_completed', 'implicit', 'r_aZ09bY18'],
      ]);
      expect(events[0].$set).toEqual({
        rivet_installed: true,
        last_install_ref: 'r_aZ09bY18',
      });

      const pageview = sent.find((e) => e.event === '$pageview')!;
      expect(pageview.properties.$current_url).toBe(KEPT_URL);
      for (const url of Object.values(urlProps(pageview))) {
        expect(url).not.toContain('#');
      }
      expectNoTokens();
    });

    it.each([
      [
        'proxy_rejected',
        { ok: false, json: async () => ({ success: false, error: 'nope' }) },
      ],
      ['request_failed', null],
    ] as const)('reports the ref on a %s failure', async (reason, response) => {
      if (response) mockProxy(response);
      else {
        globalThis.fetch = jest
          .fn()
          .mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
      }

      await renderAt(EDITOR_URL);
      capturePageview();

      expect(container.textContent).toContain('Authentication failed');
      expect(customEvents()).toEqual([
        {
          event: 'editor_sign_in_failed',
          auth_flow: 'implicit',
          reason,
          install_ref: 'r_aZ09bY18',
          $set: undefined,
          $set_once: undefined,
        },
      ]);
      expect(
        sent.find((e) => e.event === '$pageview')!.properties.$current_url,
      ).toBe(KEPT_URL);
      expectNoTokens();
    });

    it('reports the ref when Supabase sends no token', async () => {
      const fetchMock = mockProxy({ ok: true, json: async () => ({}) });

      await renderAt(
        '/auth-success?session=sess-9&ref=r_aZ09bY18#error=access_denied',
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(customEvents()).toMatchObject([
        {
          event: 'editor_sign_in_failed',
          auth_flow: 'implicit',
          reason: 'missing_token',
          install_ref: 'r_aZ09bY18',
        },
      ]);
    });

    it('reads ref only from the query, never the fragment', async () => {
      mockProxy({ ok: true, json: async () => ({ success: true }) });

      await renderAt(
        '/auth-success?session=sess-9#access_token=secret-access&ref=r_aZ09bY18',
      );

      expect(customEvents()[1]).toMatchObject({
        event: 'editor_sign_in_completed',
        auth_flow: 'implicit',
        install_ref: undefined,
      });
      expect(customEvents()[0].$set).toEqual({ rivet_installed: true });
      expectNoTokens();
    });
  });

  it('sends the PKCE reason code on failure and leaves the person alone', async () => {
    await renderAt('/auth-success?login=error&reason=session_expired');

    expect(container.textContent).toContain('This sign-in link expired.');
    expect(customEvents()).toEqual([
      {
        event: 'editor_sign_in_failed',
        auth_flow: 'pkce',
        reason: 'session_expired',
        $set: undefined,
        $set_once: undefined,
      },
    ]);
  });

  it('collapses an unrecognized reason to unknown', async () => {
    await renderAt('/auth-success?login=error&reason=someone%40example.com');

    expect(customEvents()).toMatchObject([
      { event: 'editor_sign_in_failed', reason: 'unknown' },
    ]);
  });

  it('relays implicit-flow tokens without sending them to PostHog', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await renderAt(
      '/auth-success?session=sess-123#access_token=secret-access&refresh_token=secret-refresh',
    );

    expect(container.textContent).toContain("You're signed in!");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(customEvents().map((e) => [e.event, e.auth_flow])).toEqual([
      ['$set', undefined],
      ['editor_sign_in_completed', 'implicit'],
    ]);
    expect(sent.every((e) => e.timestamp instanceof Date)).toBe(true);
    const payload = JSON.stringify(sent);
    expect(payload).not.toContain('secret-access');
    expect(payload).not.toContain('secret-refresh');
  });

  it('reports a proxy rejection without its message', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'token for a@b.co invalid' }),
    }) as unknown as typeof fetch;

    await renderAt('/auth-success?session=s#access_token=t');

    expect(container.textContent).toContain('token for a@b.co invalid');
    expect(customEvents()).toMatchObject([
      {
        event: 'editor_sign_in_failed',
        auth_flow: 'implicit',
        reason: 'proxy_rejected',
      },
    ]);
    expect(JSON.stringify(sent)).not.toContain('a@b.co');
  });

  it('still shows success when PostHog throws', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(posthog, 'capture').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(posthog, 'setPersonProperties').mockImplementation(() => {
      throw new Error('blocked');
    });

    await renderAt('/auth-success?login=complete');

    expect(container.textContent).toContain("You're signed in!");
  });
});
