import './styles/index.css';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './App';
import { PAGES } from './pages';
import { linkVisitor, takeLinkCode } from './lib/linkVisitor';
import { initPostHog } from './lib/posthog';

// Take `link` off the URL before init. The first pageview reads it there.
const linkCode = takeLinkCode();
initPostHog();
if (linkCode) linkVisitor(linkCode);

const container = document.getElementById('app')!;
const root = createRoot(container);

// Production answers these with a 301 (see src/staticHtml.ts); this covers
// the dev server, which does not.
const requestedPath = window.location.pathname;
const isLegacyAboutPath =
  requestedPath === '/story' ||
  requestedPath === '/blog' ||
  requestedPath.startsWith('/blog/');
const path = isLegacyAboutPath ? '/about' : requestedPath;

if (isLegacyAboutPath) window.history.replaceState(null, '', '/about');

const Page = PAGES[path]?.Component ?? App;

// Only App mounts SplashScreen, the one component that dismisses the inline
// splash shell painted by index.html. The shell's own gate is path-based and
// should never have raised it here — but if the two gates ever drift, this
// takes it down instead of leaving the page covered until the shell's 10s
// CSS timeout.
if (Page !== App) document.documentElement.removeAttribute('data-splash');

root.render(createElement(Page));
