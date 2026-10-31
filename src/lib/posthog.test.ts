import { PostHog, type CaptureResult } from 'posthog-js';
import { initPostHog, posthog, redactAuthTokens } from './posthog';

describe('initPostHog', () => {
  afterEach(() => jest.restoreAllMocks());

  it('persists identity in a cross-subdomain cookie and keeps the redaction hook', () => {
    const init = jest.spyOn(posthog, 'init').mockReturnValue(posthog);
    const register = jest.spyOn(posthog, 'register').mockImplementation();

    initPostHog();

    expect(init).toHaveBeenCalledTimes(1);
    const [key, options] = init.mock.calls[0];
    expect(key).toMatch(/^phc_/);
    expect(options).toEqual({
      api_host: 'https://us.i.posthog.com',
      autocapture: true,
      capture_pageview: true,
      persistence: 'localStorage+cookie',
      cross_subdomain_cookie: true,
      before_send: redactAuthTokens,
    });
    expect(options?.before_send).toBe(redactAuthTokens);
    expect(register).toHaveBeenCalledWith({ source: 'landing' });
  });

  it('works on localhost with a host-only cookie', () => {
    const init = jest.spyOn(posthog, 'init').mockReturnValue(posthog);
    jest.spyOn(posthog, 'register').mockImplementation();
    initPostHog();
    const [key, options] = init.mock.calls[0];
    jest.restoreAllMocks();

    const writes: string[] = [];
    const cookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie',
    )!;
    jest.spyOn(document, 'cookie', 'set').mockImplementation((value) => {
      writes.push(value);
      cookie.set!.call(document, value);
    });

    const local = new PostHog().init(key, {
      ...options,
      api_host: 'http://posthog.invalid',
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      advanced_disable_flags: true,
      before_send: () => null,
    })!;

    const id = local.get_distinct_id();
    expect(id).toBeTruthy();
    const write = writes
      .filter((w) => w.startsWith(`ph_${key}_posthog=`))
      .at(-1);
    expect(decodeURIComponent(write!)).toContain(id);
    expect(write).not.toMatch(/domain=/);
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
      'http://localhost/auth-success?session=s1',
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
        $initial_current_url: 'http://localhost/auth-success?session=s1',
      },
      urls: [
        'http://localhost/auth-success?session=s1',
        'http://localhost/#demo',
      ],
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
      $session_entry_url:
        'http://localhost/auth-success?session=s1&ref=r_aZ09bY18',
    });
  });

  it('passes a dropped event through as null', () => {
    expect(redactAuthTokens(null)).toBeNull();
  });
});
