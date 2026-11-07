import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const srcDir = fileURLToPath(new URL('./src/', import.meta.url));

// Architecture, Security and Privacy. Production only: the dev server's hot reload
// needs an inline script. Pixi decodes textures in a worker from a blob URL.
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
].join('; ');

function cspInProduction(): Plugin {
  return {
    name: 'matematika:csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  // GitHub Pages serves the game under /matematika/ (architecture, ADR-10); the deploy job
  // sets VITE_BASE. Locally and in tests it is the root.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), cspInProduction()],
  resolve: {
    alias: [{ find: /^@\//, replacement: srcDir }],
  },
  build: {
    // Pixi alone passes Vite's 500 kB warning; the real budget (1 MB of gzipped
    // JavaScript, 30 MB in total) is reported by scripts/check-size.ts.
    chunkSizeWarningLimit: 2000,
  },
  server: {
    // The tablet opens http://<PC IP>:5173, so the port must not drift.
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
