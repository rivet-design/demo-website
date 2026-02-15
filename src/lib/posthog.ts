import posthog from 'posthog-js';

const POSTHOG_PUBLIC_API_KEY = 'phc_Ntj9tXHbS64XgYxlTfhglRmFivFsfm0AERph4ZlnNH';
const POSTHOG_PUBLIC_HOST = 'https://us.i.posthog.com';

/**
 * Initialize PostHog with autocapture for the landing page
 */
export const initPostHog = (): void => {
  posthog.init(POSTHOG_PUBLIC_API_KEY, {
    api_host: POSTHOG_PUBLIC_HOST,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
  });

  posthog.register({
    source: 'landing',
  });
};

export { posthog };
