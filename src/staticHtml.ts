import type { Plugin } from 'vite';

const isHomeDocument = (url: string) => {
  const pathname = url.split('?')[0];
  return pathname === '/' || pathname === '/index.html';
};

export const htmlForRoute = (html: string, url: string): string =>
  isHomeDocument(url)
    ? html
    : html.replace(/<main id="site-summary">[\s\S]*?<\/main>/, '');

export const staticHtmlPlugin = (): Plugin => ({
  name: 'rivet-static-html',
  transformIndexHtml(html, context) {
    return htmlForRoute(html, context.originalUrl ?? context.path);
  },
  generateBundle: {
    order: 'post',
    handler(_options, bundle) {
      const index = bundle['index.html'];
      if (
        !index ||
        index.type !== 'asset' ||
        typeof index.source !== 'string'
      ) {
        this.error(
          'The static HTML plugin requires an index.html build output.',
        );
      }
      this.emitFile({
        type: 'asset',
        fileName: 'app.html',
        source: htmlForRoute(index.source, '/app.html'),
      });
    },
  },
  configurePreviewServer(server) {
    // Run after Vite serves assets and resolves its SPA fallback, before it
    // sends index.html. originalUrl preserves the visitor's actual route.
    return () => {
      server.middlewares.use((req, _res, next) => {
        if (
          req.url === '/index.html' &&
          !isHomeDocument(req.originalUrl ?? '/')
        ) {
          req.url = '/app.html';
        }
        next();
      });
    };
  },
});
