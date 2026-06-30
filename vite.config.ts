import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Rivet's original-code panel needs production/preview builds to expose the
    // TSX source locations that Vite's dev server already provides.
    sourcemap: true,
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
