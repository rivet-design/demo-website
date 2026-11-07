// Campaign refs name links handed out in newsletters and at events.
// A known `?ref=<slug>` becomes utm_source, utm_medium, utm_campaign, and
// utm_content before PostHog reads the address bar. `/auth-success?ref=`
// is an install ref and is left untouched. Any explicit utm_* param wins.

export type CampaignRefMedium = 'email' | 'social' | 'referral' | 'event';

export type CampaignRef = {
  readonly source: string;
  readonly medium: CampaignRefMedium;
  readonly campaign: string;
};

export type CampaignRefTable = Readonly<Record<string, CampaignRef>>;

export const CAMPAIGN_REFS = {} as const satisfies CampaignRefTable;

const AUTH_SUCCESS_PATH = '/auth-success';

export const expandCampaignRef = (
  table: CampaignRefTable = CAMPAIGN_REFS,
): void => {
  try {
    const url = new URL(window.location.href);
    if (url.pathname === AUTH_SUCCESS_PATH) return;
    const refs = url.searchParams.getAll('ref');
    if (refs.length !== 1) return;
    for (const key of url.searchParams.keys()) {
      if (key.startsWith('utm_')) return;
    }
    const slug = refs[0].trim().toLowerCase();
    // Own keys only, so `?ref=__proto__` and `?ref=constructor` miss.
    if (!Object.prototype.hasOwnProperty.call(table, slug)) return;
    const ref = table[slug];
    url.searchParams.delete('ref');
    url.searchParams.set('utm_source', ref.source);
    url.searchParams.set('utm_medium', ref.medium);
    url.searchParams.set('utm_campaign', ref.campaign);
    url.searchParams.set('utm_content', slug);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // A blocked history API must not stop the page from loading.
  }
};
