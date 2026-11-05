import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'source',
  base: './',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    manifest: {
      name: '练什么 · 极简训练记录', short_name: '练什么', lang: 'zh-CN',
      description: '打开就知道今天练什么。计划、记录、保存，都在本地。',
      start_url: './', scope: './', display: 'standalone',
      background_color: '#171b18', theme_color: '#171b18',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png}'],
      globIgnores: ['source/**', 'node_modules/**', 'tests/**', 'test-results/**', 'playwright-report/**'],
      navigateFallback: 'index.html', cleanupOutdatedCaches: true, clientsClaim: true
    }
  })],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true }
});
