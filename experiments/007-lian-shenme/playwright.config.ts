import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 40000,
  use: { baseURL: 'http://127.0.0.1:8000', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' },
  webServer: { command: 'python3 -m http.server 8000 --bind 0.0.0.0 --directory ../..', url: 'http://127.0.0.1:8000', reuseExistingServer: !process.env.CI },
  reporter: 'list'
});
