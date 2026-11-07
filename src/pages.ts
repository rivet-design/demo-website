import type { ComponentType } from 'react';
import App from './App';
import DownloadPage from './components/DownloadPage';
import AuthSuccessPage from './components/AuthSuccessPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import VariantsDemoPage from './components/VariantsDemoPage';
import AboutPage, { aboutPost } from './blog/AboutPage';
import { SESSION_PROMPT } from './components/variantsDemo/data';

export type Page = {
  Component: ComponentType;
  title: string;
  description: string;
  /** Listed in the sitemap and open to search engines. */
  indexed: boolean;
};

/**
 * Every route the site serves. The build writes one HTML file per entry and
 * the server answers 404 for any other path, so a page missing here is
 * unreachable in production.
 */
export const PAGES: Readonly<Record<string, Page>> = {
  // index.html is the home document; the build checks these two match it.
  '/': {
    Component: App,
    title: 'Rivet - Explore dozens of design directions from your agent',
    description:
      'Rivet is a design agent for your coding agent. It explores dozens of design directions in parallel so you can pick the one that fits.',
    indexed: true,
  },
  '/about': {
    Component: AboutPage,
    title: 'About — Rivet',
    description: aboutPost.meta.description,
    indexed: true,
  },
  '/download': {
    Component: DownloadPage,
    title: 'Download Rivet',
    description: 'Download Rivet for Mac. Compatible with Apple Silicon Macs.',
    indexed: true,
  },
  '/privacy': {
    Component: PrivacyPolicyPage,
    title: 'Privacy Policy — Rivet',
    description:
      'How and why Rivet might access, collect, store, use, and/or share your personal information when you use our services.',
    indexed: true,
  },
  '/terms': {
    Component: TermsPage,
    title: 'Terms of Use — Rivet',
    description:
      'The legal terms that govern your access to and use of rivet.design and the Rivet services.',
    indexed: true,
  },
  '/variants': {
    Component: VariantsDemoPage,
    title: 'Variants demo — Rivet',
    description: `Explore directions, live. ${SESSION_PROMPT}`,
    indexed: false,
  },
  '/auth-success': {
    Component: AuthSuccessPage,
    title: 'Signing you in — Rivet',
    description: 'Please wait while we complete your authentication.',
    indexed: false,
  },
};
