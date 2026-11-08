import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.spec.ts',fullyParallel:false,workers:1,timeout:45000,
  use:{baseURL:'http://localhost:5173',viewport:{width:1440,height:900},headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']},screenshot:'only-on-failure'},
  webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:!process.env.CI,timeout:30000},
});
