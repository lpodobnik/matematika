import { defineConfig } from '@playwright/test';

// End-to-end flows against the dev server (story 2.13; device profiles in epic 6). They run
// in the installed Microsoft Edge, at the tablet's 1280 × 800 and the phone's 640 × 360.
// With E2E_URL set they use a server already running there; otherwise they start their own
// on port 5291, never touching one on 5173.
const url = process.env.E2E_URL ?? 'http://localhost:5291/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: url, channel: 'msedge', headless: true },
  projects: [
    { name: 'tablet', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone', use: { viewport: { width: 640, height: 360 } } },
  ],
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: 'npx vite --port 5291 --strictPort',
        url,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
