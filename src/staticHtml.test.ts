import { readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  htmlForRoute,
  redirectTarget,
  renderPageHtml,
  sitemapXml,
  staticHtmlPlugin,
  type PrerenderedPage,
} from './staticHtml';
import type { Connect, PreviewServer } from 'vite';

const projectRoot = resolve(__dirname, '..');
const html = readFileSync(
  process.env.STATIC_HTML_PATH ?? resolve(projectRoot, 'index.html'),
  'utf8',
);

const parseHtml = () => new DOMParser().parseFromString(html, 'text/html');

describe('HTML available without JavaScript', () => {
  it('includes the hero, product explanation, and workflow in the app root', () => {
    const page = parseHtml();
    const app = page.querySelector('#app')!;
    expect(
      app.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Explore dozens of design directions from your agent.');
    expect(app.textContent).toContain('Rivet is a design agent');
    expect(app.querySelector('h2')?.textContent).toBe('How it works');
    expect(app.querySelectorAll('ol li').length).toBeGreaterThanOrEqual(3);
    expect(
      app.querySelector('a[href="https://docs.rivet.design/"]'),
    ).not.toBeNull();
    expect(
      app.querySelector('noscript, [hidden], [aria-hidden="true"]'),
    ).toBeNull();
  });

  it('identifies rivet.design in social page and image URLs', () => {
    const page = parseHtml();
    for (const key of ['og:url', 'twitter:url']) {
      expect(
        page
          .querySelector(`meta[property="${key}"], meta[name="${key}"]`)
          ?.getAttribute('content'),
      ).toBe('https://rivet.design/');
    }
    for (const key of ['og:image', 'twitter:image']) {
      const value = page
        .querySelector(`meta[property="${key}"], meta[name="${key}"]`)
        ?.getAttribute('content');
      expect(value).toBe('https://rivet.design/images/rivet-social-v2.jpg');
      expect(
        existsSync(
          resolve(projectRoot, 'public', new URL(value!).pathname.slice(1)),
        ),
      ).toBe(true);
    }
    expect(page.head.innerHTML).not.toContain('tryrivet.design');
  });

  it.each(['/', '/index.html', '/?ref=launch', '/index.html?embed=1'])(
    'keeps the summary on %s',
    (url) => {
      expect(htmlForRoute(html, url)).toContain('<main id="site-summary">');
    },
  );

  it.each([
    '/story',
    '/download',
    '/auth-success',
    '/privacy',
    '/terms',
    '/variants',
    '/about',
    '/blog',
    '/blog/old-post',
    '/story?ref=launch',
    '/unknown',
  ])('does not send homepage copy for %s', (url) => {
    const page = new DOMParser().parseFromString(
      htmlForRoute(html, url),
      'text/html',
    );
    expect(page.querySelector('#app')?.textContent?.trim()).toBe('');
    expect(page.querySelector('script[type="module"]')).not.toBeNull();
  });

  it('links the About page at /about', () => {
    expect(parseHtml().querySelector('a[href="/about"]')).not.toBeNull();
    expect(html).not.toContain('href="/story"');
  });

  it('describes Rivet in home JSON-LD without ratings or prices', () => {
    const block = parseHtml().querySelector(
      'script[type="application/ld+json"]',
    )!.textContent!;
    const graph = JSON.parse(block)['@graph'];
    expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual([
      'Organization',
      'SoftwareApplication',
    ]);
    expect(graph[0].sameAs).toEqual(
      expect.arrayContaining([
        'https://docs.rivet.design',
        'https://github.com/rivet-design',
      ]),
    );
    expect(block).not.toMatch(/aggregateRating|review|offers|price/i);
  });
});

const page = (overrides: Partial<PrerenderedPage> = {}): PrerenderedPage => ({
  path: '/terms',
  title: 'Terms of Use — Rivet',
  description: 'The "legal" terms & conditions.',
  indexed: true,
  body: '<div><h1>Terms of Use</h1><p>Costs $5.</p></div>',
  ...overrides,
});

const parseRendered = (rendered: PrerenderedPage) =>
  new DOMParser().parseFromString(renderPageHtml(html, rendered), 'text/html');

describe('prerendered route HTML', () => {
  it('gives the route its own title, description, canonical, and social URLs', () => {
    const doc = parseRendered(page());
    const meta = (key: string) =>
      doc
        .querySelector(`meta[name="${key}"], meta[property="${key}"]`)
        ?.getAttribute('content');
    expect(doc.title).toBe('Terms of Use — Rivet');
    for (const key of [
      'description',
      'og:description',
      'twitter:description',
    ]) {
      expect(meta(key)).toBe('The "legal" terms & conditions.');
    }
    for (const key of ['og:title', 'twitter:title']) {
      expect(meta(key)).toBe('Terms of Use — Rivet');
    }
    for (const key of ['og:url', 'twitter:url']) {
      expect(meta(key)).toBe('https://rivet.design/terms');
    }
    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://rivet.design/terms');
    expect(doc.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('replaces the home summary and JSON-LD with the route body', () => {
    const doc = parseRendered(page());
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('#app')?.textContent?.trim()).toBe(
      'Terms of UseCosts $5.',
    );
    expect(doc.querySelector('#site-summary')).toBeNull();
    expect(doc.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(doc.querySelector('script[type="module"]')).not.toBeNull();
  });

  it('marks unlisted routes noindex', () => {
    expect(
      parseRendered(page({ indexed: false }))
        .querySelector('meta[name="robots"]')
        ?.getAttribute('content'),
    ).toBe('noindex');
  });

  it('keeps index.html as the home document and fails when it drifts', () => {
    const home = page({
      path: '/',
      title: 'Rivet - Explore dozens of design directions from your agent',
      description:
        'Rivet is a design agent for your coding agent. It explores dozens of design directions in parallel so you can pick the one that fits.',
      body: null,
    });
    expect(renderPageHtml(html, home)).toBe(html);
    expect(() => renderPageHtml(html, { ...home, title: 'Other' })).toThrow();
  });
});

describe('sitemapXml', () => {
  it('lists indexed routes with lastmod', () => {
    const xml = sitemapXml(
      [page({ path: '/' }), page({ path: '/about' }), page({ indexed: false })],
      '2026-11-07',
    );
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(
      [...doc.querySelectorAll('loc')].map((loc) => loc.textContent),
    ).toEqual(['https://rivet.design/', 'https://rivet.design/about']);
    expect(doc.querySelector('lastmod')?.textContent).toBe('2026-11-07');
  });
});

describe('redirectTarget', () => {
  it.each([
    ['/story', '/about'],
    ['/story/', '/about'],
    ['/blog', '/about'],
    ['/blog/old-post', '/about'],
    ['/about/', '/about'],
    ['/privacy//', '/privacy'],
    ['/', null],
    ['/about', null],
    ['/unknown', null],
  ])('%s -> %s', (from, to) => {
    expect(redirectTarget(from)).toBe(to);
  });
});

describe('preview server', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'rivet-dist-'));
  writeFileSync(join(outDir, '404.html'), '<h1>Page not found</h1>');
  writeFileSync(join(outDir, 'sitemap.xml'), '<urlset/>');

  const install = () => {
    const use = jest.fn();
    const server = {
      middlewares: { use },
      config: { root: outDir, build: { outDir: '.' } },
    } as unknown as PreviewServer;
    const configure = staticHtmlPlugin().configurePreviewServer;
    if (typeof configure !== 'function')
      throw new Error('Missing preview hook');
    const post = configure(server);
    if (typeof post !== 'function') throw new Error('Missing post hook');
    const pre = use.mock.calls[0][0] as Connect.NextHandleFunction;
    post();
    return { pre, post: use.mock.calls[1][0] as Connect.NextHandleFunction };
  };

  const run = (
    middleware: Connect.NextHandleFunction,
    url: string,
    originalUrl = url,
  ) => {
    const req = { url, originalUrl } as Connect.IncomingMessage;
    const headers: Record<string, string> = {};
    const res = {
      statusCode: 200,
      setHeader: (key: string, value: string) => (headers[key] = value),
      end: jest.fn(),
    };
    const next = jest.fn();
    middleware(
      req,
      res as unknown as Parameters<Connect.NextHandleFunction>[1],
      next,
    );
    return { req, res, headers, next };
  };

  it('301s legacy About URLs and trailing slashes once the fallback resolves them, keeping the query', () => {
    const { post } = install();
    expect(run(post, '/index.html', '/story?ref=launch')).toMatchObject({
      res: { statusCode: 301 },
      headers: { Location: '/about?ref=launch' },
    });
    expect(run(post, '/index.html', '/download/').headers.Location).toBe(
      '/download',
    );
    expect(run(post, '/about.html', '/about').next).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/r8t/k/',
    '/r8t/i/v0/k/',
    '/r8t/flags/?v=2',
    '/p/demo/',
    '/share/abc/',
  ])('leaves proxy request %s for the proxies', (url) => {
    const { pre, post } = install();
    const before = run(pre, url);
    expect(before.next).toHaveBeenCalledTimes(1);
    expect(before.res.statusCode).toBe(200);
    const after = run(post, url);
    expect(after.next).toHaveBeenCalledTimes(1);
    expect(after.headers.Location).toBeUndefined();
  });

  it('sends the sitemap as application/xml and 404.html as a 404', () => {
    const { pre } = install();
    expect(run(pre, '/sitemap.xml').headers['Content-Type']).toBe(
      'application/xml; charset=utf-8',
    );
    expect(run(pre, '/404.html').res.statusCode).toBe(404);
  });

  it('answers 404 when the fallback lands a non-home URL on index.html', () => {
    const { post } = install();
    const unknown = run(post, '/index.html', '/this-does-not-exist');
    expect(unknown.res.statusCode).toBe(404);
    expect(String(unknown.res.end.mock.calls[0][0])).toContain(
      'Page not found',
    );
    for (const [url, originalUrl] of [
      ['/index.html', '/'],
      ['/index.html', '/?ref=launch'],
      ['/about.html', '/about'],
      ['/assets/app.js', '/assets/app.js'],
    ]) {
      const known = run(post, url, originalUrl);
      expect(known.next).toHaveBeenCalledTimes(1);
      expect(known.req.url).toBe(url);
    }
  });

  it('sends Referrer-Policy no-referrer only for /auth-success', () => {
    const { post } = install();
    expect(
      run(post, '/auth-success.html', '/auth-success?link=x').headers[
        'Referrer-Policy'
      ],
    ).toBe('no-referrer');
    expect(
      run(post, '/download.html', '/download').headers['Referrer-Policy'],
    ).toBeUndefined();
  });
});
