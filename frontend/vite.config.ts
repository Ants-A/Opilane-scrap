import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solid({ hot: !process.env.VITEST }),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['solid-js'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: { '/api': { target: process.env.API_TARGET || 'http://localhost:8080', changeOrigin: true } },
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
