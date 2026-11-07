import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PAGES } from './pages';
import type { PrerenderedPage } from './staticHtml';

export const prerender = (): PrerenderedPage[] =>
  Object.entries(PAGES).map(
    ([path, { Component, title, description, indexed }]) => ({
      path,
      title,
      description,
      indexed,
      // The home document keeps the hand-written summary in index.html; the
      // landing app is animation-driven and has no meaningful server render.
      body: path === '/' ? null : renderToString(createElement(Component)),
    }),
  );
