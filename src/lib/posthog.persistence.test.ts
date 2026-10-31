/**
 * @jest-environment-options {"url": "https://rivet.design/"}
 */
import { PostHog, type PostHogConfig } from 'posthog-js';
import { initPostHog, posthog } from './posthog';

const OFFLINE: Partial<PostHogConfig> = {
  api_host: 'http://posthog.invalid',
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true,
  advanced_disable_flags: true,
  before_send: () => null,
};

const productionInit = (): [string, Partial<PostHogConfig>] => {
  const init = jest.spyOn(posthog, 'init').mockReturnValue(posthog);
  jest.spyOn(posthog, 'register').mockImplementation();
  initPostHog();
  const [key, options] = init.mock.calls[0];
  jest.restoreAllMocks();
  return [key, options ?? {}];
};

const cookieDescriptor = Object.getOwnPropertyDescriptor(
  Document.prototype,
  'cookie',
)!;

const recordCookieWrites = (): string[] => {
  const writes: string[] = [];
  jest.spyOn(document, 'cookie', 'set').mockImplementation((value) => {
    writes.push(value);
    cookieDescriptor.set!.call(document, value);
  });
  jest
    .spyOn(document, 'cookie', 'get')
    .mockImplementation(() => cookieDescriptor.get!.call(document));
  return writes;
};

describe('PostHog persistence on rivet.design', () => {
  const [key, options] = productionInit();
  const storageName = `ph_${key}_posthog`;

  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${storageName}=; max-age=0; domain=.rivet.design; path=/`;
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps a returning localStorage visitor on the same distinct_id', () => {
    const legacy = new PostHog().init(key, {
      ...OFFLINE,
      persistence: 'localStorage',
    })!;
    const legacyId = legacy.get_distinct_id();
    const legacyDeviceId = legacy.get_property('$device_id');
    expect(document.cookie).not.toContain(storageName);

    const writes = recordCookieWrites();
    const current = new PostHog().init(key, { ...options, ...OFFLINE })!;

    expect(current.get_distinct_id()).toBe(legacyId);
    expect(current.get_property('$device_id')).toBe(legacyDeviceId);

    const cookieWrite = writes
      .filter((w) => w.startsWith(`${storageName}=`))
      .at(-1);
    expect(cookieWrite).toContain('domain=.rivet.design');
    expect(decodeURIComponent(cookieWrite!)).toContain(legacyId);
  });

  it('picks up the shared cookie when localStorage is empty, as on docs.rivet.design', () => {
    const first = new PostHog().init(key, { ...options, ...OFFLINE })!;
    const id = first.get_distinct_id();

    localStorage.clear();
    const docs = new PostHog().init(key, { ...options, ...OFFLINE })!;

    expect(docs.get_distinct_id()).toBe(id);
  });
});
