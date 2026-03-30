import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3333,
    open: true,
  },
  preview: {
    port: 3333,
  },
  // Prevent Vite from trying to process legacy script tags as ES modules.
  // All existing <script src="..."> tags in index.html are served as-is in dev mode.
  optimizeDeps: {
    // Don't try to pre-bundle anything — all deps are vendored in /js/
    exclude: [],
  },
});
