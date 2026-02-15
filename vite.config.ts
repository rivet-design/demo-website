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
