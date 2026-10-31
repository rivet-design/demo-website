import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import path from 'path';
import { createPostHogProxyMiddleware } from './posthogHostProxy';
import { createPrototypeProxyMiddleware } from './prototypeHostProxy';
import { staticHtmlPlugin } from './src/staticHtml';

const prototypeProxyMiddleware = createPrototypeProxyMiddleware();
const posthogProxyMiddleware = createPostHogProxyMiddleware();

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      }),
    },
    react({ include: /\.(js|jsx|ts|tsx|mdx)$/ }),
    staticHtmlPlugin(),
    {
      name: 'rivet-prototype-proxy',
      configureServer(server) {
        server.middlewares.use(prototypeProxyMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(prototypeProxyMiddleware);
      },
    },
    {
      name: 'rivet-posthog-proxy',
      configureServer(server) {
        server.middlewares.use(posthogProxyMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(posthogProxyMiddleware);
      },
    },
  ],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
  },
  preview: {
    host: true,
    allowedHosts: [
      'www.tryrivet.design',
      'tryrivet.design',
      'rivet.design',
      'www.rivet.design',
      // Render PR preview environments (rivet-frontend-pr-<n>.onrender.com).
      '.onrender.com',
    ],
  },
});
