import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import path from 'path';
import { createPrototypeProxyMiddleware } from './prototypeHostProxy';

const prototypeProxyMiddleware = createPrototypeProxyMiddleware();

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
    {
      name: 'rivet-prototype-proxy',
      configureServer(server) {
        server.middlewares.use(prototypeProxyMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(prototypeProxyMiddleware);
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
    ],
  },
});
