import './styles/index.css';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './App';
import DownloadPage from './components/DownloadPage';
import AuthSuccessPage from './components/AuthSuccessPage';
import { initPostHog } from './lib/posthog';

initPostHog();

const container = document.getElementById('app')!;
const root = createRoot(container);

// Simple routing based on pathname
const path = window.location.pathname;

const getComponent = () => {
  if (path === '/download') return DownloadPage;
  if (path === '/auth-success') return AuthSuccessPage;
  return App;
};

root.render(createElement(getComponent()));
