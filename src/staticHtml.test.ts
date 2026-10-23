import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
});
