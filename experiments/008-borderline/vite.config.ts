import { defineConfig } from 'vite';
export default defineConfig({
  root: 'source', base: './',
  build: { outDir: '../dist', emptyOutDir: true, rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  server: { port: 5173, strictPort: true }, preview: { port: 4173, strictPort: true },
});
