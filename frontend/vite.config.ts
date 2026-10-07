import tailwindcss from '@tailwindcss/vite';
import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig } from 'vitest/config';
import solid from '@solidjs/vite-plugin';

export default defineConfig({
  plugins: [
    solid({ start: true, extensions: ['.jsx', '.tsx'], diagnostics: false }),
    fileRoutes({ types: true }),
    tailwindcss(),
  ],
  cacheDir: '/tmp/.vite',
  resolve: {
    dedupe: ['solid-js'],
  },
  optimizeDeps: {
    exclude: ['@solidjs/start-devtools'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest-setup.ts'],
    isolate: false,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});