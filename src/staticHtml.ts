import { readFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const SITE_ORIGIN = 'https://rivet.design';

export type PrerenderedPage = {
  path: string;
  title: string;
  description: string;
  indexed: boolean;
  /** Markup for #app, or null to keep the summary already in index.html. */
  body: string | null;
};

const isHomeDocument = (url: string) => {
  const pathname = url.split('?')[0];
  return pathname === '/' || pathname === '/index.html';
};

const SUMMARY = /<main id="site-summary">[\s\S]*?<\/main>/;
const JSON_LD = /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;

export const htmlForRoute = (html: string, url: string): string =>
  isHomeDocument(url) ? html : html.replace(SUMMARY, '');

export const canonicalUrl = (path: string) => `${SITE_ORIGIN}${path}`;

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const replaceOnce = (
  html: string,
  pattern: RegExp,
  replacement: (match: string, ...groups: string[]) => string,
) => {
  if (!pattern.test(html)) {
    throw new Error(`index.html is missing ${pattern}`);
  }
  return html.replace(pattern, replacement);
};

const setMeta = (html: string, key: string, value: string) =>
  replaceOnce(
    html,
    new RegExp(`(<meta\\s+(?:name|property)="${key}"\\s+content=")[^"]*"`),
    (_match, prefix) => `${prefix}${escapeAttribute(value)}"`,
  );

export const renderPageHtml = (
  template: string,
  page: PrerenderedPage,
): string => {
  if (page.body === null) {
    for (const value of [`<title>${page.title}</title>`, page.description]) {
      if (!template.includes(value)) {
        throw new Error(
          `index.html does not match PAGES['${page.path}']: ${value}`,
        );
      }
    }
    return template;
  }
  const url = canonicalUrl(page.path);
  let html = replaceOnce(
    template,
    /<title>[^<]*<\/title>/,
    () => `<title>${escapeAttribute(page.title)}</title>`,
  );
  for (const key of ['description', 'og:description', 'twitter:description']) {
    html = setMeta(html, key, page.description);
  }
  for (const key of ['og:title', 'twitter:title']) {
    html = setMeta(html, key, page.title);
  }
  for (const key of ['og:url', 'twitter:url']) {
    html = setMeta(html, key, url);
  }
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"/,
    () => `<link rel="canonical" href="${url}"`,
  );
  if (!page.indexed) {
    html = replaceOnce(
      html,
      /<\/head>/,
      () => '  <meta name="robots" content="noindex" />\n</head>',
    );
  }
  html = replaceOnce(html, JSON_LD, () => '');
  const body = page.body;
  return replaceOnce(html, SUMMARY, () => body);
};

export const sitemapXml = (pages: PrerenderedPage[], lastmod: string) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages
      .filter((page) => page.indexed)
      .map(
        (page) =>
          `  <url>\n    <loc>${canonicalUrl(page.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
      ),
    '</urlset>',
    '',
  ].join('\n');

/** Where a request should 301 to, or null to serve it as is. */
export const redirectTarget = (pathname: string): string | null => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const trimmed = pathname.replace(/\/+$/, '') || '/';
    return redirectTarget(trimmed) ?? trimmed;
  }
  if (
    pathname === '/story' ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/')
  ) {
    return '/about';
  }
  return null;
};

export const staticHtmlPlugin = (): Plugin => ({
  name: 'rivet-static-html',
  transformIndexHtml(html, context) {
    return htmlForRoute(html, context.originalUrl ?? context.path);
  },
  configurePreviewServer(server) {
    const outDir = resolve(server.config.root, server.config.build.outDir);
    const sendFile = (
      res: ServerResponse,
      status: number,
      contentType: string,
      file: string,
    ) => {
      res.statusCode = status;
      res.setHeader('Content-Type', contentType);
      res.end(readFileSync(resolve(outDir, file)));
    };
    const sendNotFound = (res: ServerResponse) =>
      sendFile(res, 404, 'text/html; charset=utf-8', '404.html');

    // Ahead of Vite's static file handler, which would send sitemap.xml as
    // text/xml and 404.html with a 200.
    server.middlewares.use((req, res, next) => {
      const [pathname, query] = (req.url ?? '/').split('?');
      const target = redirectTarget(pathname);
      if (target) {
        res.statusCode = 301;
        res.setHeader('Location', query ? `${target}?${query}` : target);
        res.end();
        return;
      }
      if (pathname === '/sitemap.xml') {
        return sendFile(
          res,
          200,
          'application/xml; charset=utf-8',
          'sitemap.xml',
        );
      }
      if (pathname === '/404.html') return sendNotFound(res);
      next();
    });
    // Run after Vite serves assets and resolves its SPA fallback, before it
    // sends index.html. Vite rewrites known routes to their prerendered
    // file, so a non-home request still pointing at index.html is unknown.
    return () => {
      server.middlewares.use((req, res, next) => {
        const originalUrl = req.originalUrl ?? '/';
        // The link code is in this URL until script runs. no-referrer stops
        // the browser from sending that URL on the requests this page makes.
        if (originalUrl.split('?')[0] === '/auth-success') {
          res.setHeader('Referrer-Policy', 'no-referrer');
        }
        if (req.url === '/index.html' && !isHomeDocument(originalUrl)) {
          return sendNotFound(res);
        }
        next();
      });
    };
  },
});
