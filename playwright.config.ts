import { defineConfig } from '@playwright/test';

// End-to-end flows start in epic 5 (device profiles in epic 6). Until then this only keeps
// Playwright out of the Vitest files. Browsers are installed with:
//   npx playwright install chromium webkit
export default defineConfig({
  testDir: './e2e',
});
