import type { CaptureResult } from 'posthog-js';
import {
  CAMPAIGN_REFS,
  type CampaignRefMedium,
  type CampaignRefTable,
  expandCampaignRef,
} from './campaignRefs';
import { isInstallRef } from './installRef';
import { posthog, redactAuthTokens } from './posthog';
import { telemetry } from './telemetry';

const FIXTURE = {
  'fixture-newsletter': {
    source: 'fixture-source',
    medium: 'email',
    campaign: 'fixture-campaign',
  },
} as const satisfies CampaignRefTable;

const UTM = {
  utm_source: 'fixture-source',
  utm_medium: 'email',
  utm_campaign: 'fixture-campaign',
  utm_content: 'fixture-newsletter',
};

const EXPANDED_HOME =
  'http://localhost/?utm_source=fixture-source&utm_medium=email&utm_campaign=fixture-campaign&utm_content=fixture-newsletter';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOKEN_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const CAMPAIGN_REF_MEDIUMS: readonly CampaignRefMedium[] = [
  'email',
  'social',
  'referral',
  'event',
];

type RefFields = {
  source: string;
  medium: string;
  campaign: string;
};

const acceptsCampaignRef = (slug: string, ref: RefFields): boolean =>
  slug.length <= 64 &&
  SLUG_PATTERN.test(slug) &&
  !isInstallRef(slug) &&
  TOKEN_PATTERN.test(ref.source) &&
  TOKEN_PATTERN.test(ref.campaign) &&
  (CAMPAIGN_REF_MEDIUMS as readonly string[]).includes(ref.medium);

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

const setUrl = (url: string) => window.history.replaceState(null, '', url);

beforeEach(() => {
  sent = [];
  posthog.reset();
  setUrl('/');
});

afterEach(() => {
  posthog.__loaded = true;
  jest.restoreAllMocks();
});

describe('expandCampaignRef', () => {
  it('replaces a known ref with utm params', () => {
    setUrl('/?ref=fixture-newsletter');
    expandCampaignRef(FIXTURE);
    expect(window.location.href).toBe(EXPANDED_HOME);
    expect(window.location.search).not.toContain('ref=');
  });

  it('keeps other params and the hash', () => {
    setUrl('/download?embed=1&ref=fixture-newsletter#install');
    expandCampaignRef(FIXTURE);
    expect(window.location.href).toBe(
      'http://localhost/download?embed=1&utm_source=fixture-source&utm_medium=email&utm_campaign=fixture-campaign&utm_content=fixture-newsletter#install',
    );
  });

  it('normalizes case and whitespace and is idempotent', () => {
    setUrl('/?ref=%20Fixture-Newsletter%20');
    expandCampaignRef(FIXTURE);
    expect(window.location.href).toBe(EXPANDED_HOME);
    const href = window.location.href;
    expandCampaignRef(FIXTURE);
    expect(window.location.href).toBe(href);
  });

  it.each([
    ['an unknown slug', '/?ref=not-a-fixture'],
    ['__proto__', '/?ref=__proto__'],
    ['constructor', '/?ref=constructor'],
    ['toString', '/?ref=toString'],
    ['an empty ref', '/?ref='],
    ['a repeated ref', '/?ref=fixture-newsletter&ref=other'],
    ['a very long ref', `/?ref=${'a'.repeat(10_000)}`],
    ['an explicit utm param', '/?ref=fixture-newsletter&utm_source=explicit'],
    [
      'an install ref on /auth-success',
      '/auth-success?login=complete&ref=r_aZ09bY18',
    ],
    [
      'a campaign slug on /auth-success',
      '/auth-success?ref=fixture-newsletter',
    ],
  ])('leaves the URL unchanged for %s', (_label, url) => {
    setUrl(url);
    const href = window.location.href;
    expect(() => expandCampaignRef(FIXTURE)).not.toThrow();
    expect(window.location.href).toBe(href);
  });

  it('does not throw when history.replaceState throws', () => {
    setUrl('/?ref=fixture-newsletter');
    const href = window.location.href;
    jest.spyOn(window.history, 'replaceState').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => expandCampaignRef(FIXTURE)).not.toThrow();
    expect(window.location.href).toBe(href);
  });

  it('still expands when storage getters throw', () => {
    setUrl('/?ref=fixture-newsletter');
    const restore: Array<() => void> = [];
    for (const key of ['localStorage', 'sessionStorage'] as const) {
      const owner = Object.prototype.hasOwnProperty.call(window, key)
        ? window
        : Object.getPrototypeOf(window);
      const descriptor = Object.getOwnPropertyDescriptor(owner, key);
      Object.defineProperty(owner, key, {
        configurable: true,
        get() {
          throw new Error(`blocked ${key}`);
        },
      });
      restore.push(() => {
        if (descriptor) Object.defineProperty(owner, key, descriptor);
      });
    }
    try {
      expect(() => window.localStorage).toThrow('blocked localStorage');
      expect(() => window.sessionStorage).toThrow('blocked sessionStorage');
      expect(() => expandCampaignRef(FIXTURE)).not.toThrow();
      expect(window.location.href).toBe(EXPANDED_HOME);
    } finally {
      for (const undo of restore.reverse()) undo();
    }
  });

  it('attributes the pageview and later conversions in the same tab', () => {
    setUrl('/?ref=fixture-newsletter');
    expandCampaignRef(FIXTURE);
    posthog.capture('$pageview');

    const pageview = sent.find((event) => event.event === '$pageview');
    expect(pageview?.properties).toMatchObject(UTM);
    expect(pageview?.properties.$current_url).not.toContain('ref=');
    expect(pageview?.properties.$current_url).toContain(
      'utm_content=fixture-newsletter',
    );

    setUrl('/download');
    telemetry.trackDownloadClicked({
      source: 'download_page',
      downloadType: 'mac',
      installRef: 'r_aZ09bY18',
      version: '1.0.0',
    });
    posthog.capture('download_clicked');

    const downloads = sent.filter(
      (event) => event.event === 'download_clicked',
    );
    expect(downloads).toHaveLength(2);
    for (const event of downloads) {
      expect(event.properties).toMatchObject(UTM);
      expect(event.properties.$current_url).toContain('/download');
      expect(event.properties.$current_url).not.toContain('ref=');
    }
  });
});

describe('CAMPAIGN_REFS', () => {
  const sixtyFour = 'a'.repeat(64);
  const sixtyFive = 'a'.repeat(65);

  it.each([
    ...Object.entries(CAMPAIGN_REFS).map(([slug, ref]) => ({
      slug,
      source: ref.source,
      medium: ref.medium,
      campaign: ref.campaign,
      ok: true,
    })),
    {
      slug: 'fixture-newsletter',
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: true,
    },
    {
      slug: 'a',
      source: 'a',
      medium: 'social',
      campaign: 'a.b_c-d',
      ok: true,
    },
    {
      slug: sixtyFour,
      source: sixtyFour,
      medium: 'event',
      campaign: sixtyFour,
      ok: true,
    },
    {
      slug: 'Bad_Slug',
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: 'fixture--newsletter',
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: sixtyFive,
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: 'r_aZ09bY18',
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: 'r_aaaaaaaa',
      source: 'fixture-source',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: 'fixture-newsletter',
      source: 'has space',
      medium: 'email',
      campaign: 'fixture-campaign',
      ok: false,
    },
    {
      slug: 'fixture-newsletter',
      source: 'fixture-source',
      medium: 'email',
      campaign: sixtyFive,
      ok: false,
    },
    {
      slug: 'fixture-newsletter',
      source: 'fixture-source',
      medium: 'sms',
      campaign: 'fixture-campaign',
      ok: false,
    },
  ])(
    '$slug / $medium is accepted: $ok',
    ({ slug, source, medium, campaign, ok }) => {
      expect(acceptsCampaignRef(slug, { source, medium, campaign })).toBe(ok);
    },
  );
});
