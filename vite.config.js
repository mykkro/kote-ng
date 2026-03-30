import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3333,
    open: true,
    // Suppress "Failed to load source map" warnings for vendored minified libs
    // that ship without their accompanying .map files.
    sourcemapIgnoreList: () => true,
  },
  preview: {
    port: 3333,
  },
  optimizeDeps: {
    exclude: [],
  },
});
