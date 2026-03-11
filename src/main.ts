import './styles/index.css';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './App';
import DownloadPage from './components/DownloadPage';
import AuthSuccessPage from './components/AuthSuccessPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import MCPPage from './components/MCPPage';
import { initPostHog } from './lib/posthog';

initPostHog();

const container = document.getElementById('app')!;
const root = createRoot(container);

// Simple routing based on pathname
const path = window.location.pathname;

const getComponent = () => {
  if (path === '/download') return DownloadPage;
  if (path === '/auth-success') return AuthSuccessPage;
  if (path === '/privacy') return PrivacyPolicyPage;
  if (path === '/terms') return TermsPage;
  if (path === '/mcp') return MCPPage;
  return App;
};

root.render(createElement(getComponent()));
