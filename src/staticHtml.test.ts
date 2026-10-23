import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { htmlForRoute, staticHtmlPlugin } from './staticHtml';
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

  it('selects the built app shell only after Vite resolves a non-home fallback', () => {
    const use = jest.fn();
    const server = { middlewares: { use } } as unknown as PreviewServer;
    const configure = staticHtmlPlugin().configurePreviewServer;
    if (typeof configure !== 'function')
      throw new Error('Missing preview hook');
    const install = configure(server);
    expect(use).not.toHaveBeenCalled();
    if (typeof install !== 'function') throw new Error('Missing post hook');
    install();
    const middleware = use.mock.calls[0][0] as Connect.NextHandleFunction;
    for (const [url, originalUrl, expected] of [
      ['/index.html', '/', '/index.html'],
      ['/index.html', '/?ref=launch', '/index.html'],
      ['/index.html', '/index.html', '/index.html'],
      ['/index.html', '/story', '/app.html'],
      ['/index.html', '/download?ref=launch', '/app.html'],
      ['/index.html', '/blog/old-post', '/app.html'],
      ['/assets/app.js', '/assets/app.js', '/assets/app.js'],
      ['/other.html', '/other.html', '/other.html'],
    ]) {
      const req = { url, originalUrl } as Connect.IncomingMessage;
      const next = jest.fn();
      middleware(req, {} as Parameters<Connect.NextHandleFunction>[1], next);
      expect(req.url).toBe(expected);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });
});
