import './styles/index.css';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './App';
import DownloadPage from './components/DownloadPage';
import AuthSuccessPage from './components/AuthSuccessPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import VariantsDemoPage from './components/VariantsDemoPage';
import AboutPage from './blog/AboutPage';
import { initPostHog } from './lib/posthog';

initPostHog();

const container = document.getElementById('app')!;
const root = createRoot(container);

// Simple routing based on pathname
const requestedPath = window.location.pathname;
const isLegacyBlogPath =
  requestedPath === '/blog' || requestedPath.startsWith('/blog/');
const path = isLegacyBlogPath ? '/about' : requestedPath;

if (isLegacyBlogPath) window.history.replaceState(null, '', '/about');

const getComponent = () => {
  if (path === '/download') return DownloadPage;
  if (path === '/auth-success') return AuthSuccessPage;
  if (path === '/privacy') return PrivacyPolicyPage;
  if (path === '/terms') return TermsPage;
  if (path === '/variants') return VariantsDemoPage;
  if (path === '/about') return AboutPage;
  return App;
};

const Page = getComponent();

// Only App mounts SplashScreen, the one component that dismisses the inline
// splash shell painted by index.html. The shell's own gate is path-based and
// should never have raised it here — but if the two gates ever drift, this
// takes it down instead of leaving the page covered until the shell's 10s
// CSS timeout.
if (Page !== App) document.documentElement.removeAttribute('data-splash');

root.render(createElement(Page));
