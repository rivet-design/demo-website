export type CampaignRefMedium = 'email' | 'social' | 'referral' | 'event';

export type CampaignRef = {
  readonly source: string;
  readonly medium: CampaignRefMedium;
  readonly campaign: string;
};

export type CampaignRefTable = Readonly<Record<string, CampaignRef>>;

export const CAMPAIGN_REFS = {} as const satisfies CampaignRefTable;

const INSTALL_REF_PATH = '/auth-success';

export const expandCampaignRef = (
  table: CampaignRefTable = CAMPAIGN_REFS,
): void => {
  const url = new URL(window.location.href);
  if (url.pathname === INSTALL_REF_PATH) return;
  const refs = url.searchParams.getAll('ref');
  if (refs.length !== 1) return;
  if ([...url.searchParams.keys()].some((key) => key.startsWith('utm_'))) {
    return;
  }
  const slug = refs[0].trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(table, slug)) return;
  const ref = table[slug];
  url.searchParams.delete('ref');
  url.searchParams.set('utm_source', ref.source);
  url.searchParams.set('utm_medium', ref.medium);
  url.searchParams.set('utm_campaign', ref.campaign);
  url.searchParams.set('utm_content', slug);
  try {
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {}
};
