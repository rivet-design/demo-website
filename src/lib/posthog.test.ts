import type { CaptureResult } from 'posthog-js';
import { POSTHOG_PROXY_PATH } from '../posthogProxy';
import { initPostHog, posthog, redactAuthTokens } from './posthog';

describe('initPostHog', () => {
  it('sends traffic through the first-party proxy and keeps redaction', () => {
    const init = jest.spyOn(posthog, 'init').mockImplementation(() => posthog);
    jest.spyOn(posthog, 'register').mockImplementation(() => undefined);

    initPostHog();

    expect(init).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        api_host: POSTHOG_PROXY_PATH,
        ui_host: 'https://us.posthog.com',
        before_send: redactAuthTokens,
      }),
    );
    const router = posthog.requestRouter;
    expect(router.endpointFor('api', '/e/')).toMatch(/\/k\/$/);
    expect(router.endpointFor('api', '/i/v0/e/')).toMatch(/\/i\/v0\/k\/$/);
    expect(
      router.endpointFor('assets', '/static/posthog-recorder.js?v=1'),
    ).toMatch(/\/static\/rr\.js\?v=1$/);
    expect(router.endpointFor('flags', '/flags/?v=2')).toMatch(
      /\/flags\/\?v=2$/,
    );
    jest.restoreAllMocks();
  });
});

const TOKEN_URL =
  'http://localhost/auth-success?session=s1#access_token=SECRET_A&refresh_token=SECRET_R';

const eventWith = (overrides: Partial<CaptureResult>): CaptureResult => ({
  uuid: 'u1',
  event: '$pageview',
  properties: {},
  ...overrides,
});

describe('redactAuthTokens', () => {
  it('keeps a Date timestamp as the same Date', () => {
    const timestamp = new Date('2026-10-05T04:30:00.000Z');

    const result = redactAuthTokens(
      eventWith({ timestamp, properties: { $current_url: TOKEN_URL } }),
    );

    expect(result?.timestamp).toBe(timestamp);
    expect(result?.timestamp?.toISOString()).toBe('2026-10-05T04:30:00.000Z');
    expect(result?.properties.$current_url).toBe(
      'http://localhost/auth-success',
    );
    expect(JSON.stringify(result)).not.toMatch(/SECRET_[AR]/);
  });

  it('strips token fragments from nested person properties and arrays', () => {
    const result = redactAuthTokens(
      eventWith({
        event: '$set',
        properties: {
          $set_once: { $initial_current_url: TOKEN_URL },
          urls: [TOKEN_URL, 'http://localhost/#demo'],
        },
      }),
    );

    expect(result?.properties).toEqual({
      $set_once: {
        $initial_current_url: 'http://localhost/auth-success',
      },
      urls: ['http://localhost/auth-success', 'http://localhost/#demo'],
    });
  });

  it('leaves non-plain values untouched', () => {
    class Custom {
      url = TOKEN_URL;
    }
    const map = new Map([['url', TOKEN_URL]]);
    const set = new Set([TOKEN_URL]);
    const custom = new Custom();
    const date = new Date(0);
    const fn = () => TOKEN_URL;

    const result = redactAuthTokens(
      eventWith({ properties: { map, set, custom, date, fn, n: 1, b: true } }),
    );

    expect(result?.properties.map).toBe(map);
    expect(result?.properties.set).toBe(set);
    expect(result?.properties.custom).toBe(custom);
    expect(result?.properties.date).toBe(date);
    expect(result?.properties.fn).toBe(fn);
    expect(result?.properties.n).toBe(1);
    expect(result?.properties.b).toBe(true);
  });

  it('keeps the ?ref= query and cuts only the token fragment', () => {
    const result = redactAuthTokens(
      eventWith({
        properties: {
          $current_url:
            'http://localhost/auth-success?login=complete&ref=r_aZ09bY18',
          $session_entry_url:
            'http://localhost/auth-success?session=s1&ref=r_aZ09bY18#access_token=SECRET_A',
        },
      }),
    );

    expect(result?.properties).toEqual({
      $current_url:
        'http://localhost/auth-success?login=complete&ref=r_aZ09bY18',
      $session_entry_url: 'http://localhost/auth-success?ref=r_aZ09bY18',
    });
  });

  it('drops any fragment and the session id from /auth-success URLs only', () => {
    const result = redactAuthTokens(
      eventWith({
        properties: {
          $current_url:
            'https://rivet.design/auth-success?session=sess-9&ref=r_aZ09bY18&account_id=0b9f3c2e-1d4a-4f6b-9e8d-7c6b5a4f3e2d#error=access_denied',
          $referrer: 'https://rivet.design/download?session=keep#section',
          $pathname: '/auth-success',
        },
      }),
    );

    expect(result?.properties).toEqual({
      $current_url:
        'https://rivet.design/auth-success?ref=r_aZ09bY18&account_id=0b9f3c2e-1d4a-4f6b-9e8d-7c6b5a4f3e2d',
      $referrer: 'https://rivet.design/download?session=keep#section',
      $pathname: '/auth-success',
    });
  });

  it('passes a dropped event through as null', () => {
    expect(redactAuthTokens(null)).toBeNull();
  });
});
