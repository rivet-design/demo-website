import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer, type Plugin, type ResolvedConfig } from 'vite';
import { renderPageHtml, sitemapXml, type PrerenderedPage } from './staticHtml';

/**
 * After the client build, renders every route in src/pages.ts to its own
 * HTML file and writes sitemap.xml. Kept apart from staticHtml.ts because
 * Vite's runtime cannot load under Jest's jsdom environment.
 */
export const prerenderPlugin = (): Plugin => {
  let config: ResolvedConfig;
  return {
    name: 'rivet-prerender',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        if (config.build.ssr) return;
        const outDir = resolve(config.root, config.build.outDir);
        const server = await createServer({
          configFile: config.configFile,
          mode: config.mode,
          logLevel: 'error',
          appType: 'custom',
          server: { middlewareMode: true, hmr: false },
        });
        try {
          const { prerender } = (await server.ssrLoadModule(
            '/src/prerender.ts',
          )) as { prerender: () => PrerenderedPage[] };
          const pages = prerender();
          const template = readFileSync(resolve(outDir, 'index.html'), 'utf8');
          for (const page of pages) {
            const html = renderPageHtml(template, page);
            if (page.body !== null) {
              writeFileSync(
                resolve(outDir, `${page.path.slice(1)}.html`),
                html,
              );
            }
          }
          const lastmod = new Date().toISOString().slice(0, 10);
          writeFileSync(
            resolve(outDir, 'sitemap.xml'),
            sitemapXml(pages, lastmod),
          );
        } finally {
          await server.close();
        }
      },
    },
  };
};
