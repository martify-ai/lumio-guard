import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// Keep the test browser inside the project. On this Windows PC, Chromium refuses
// to start from %LOCALAPPDATA%\ms-playwright (a Windows "side-by-side" error).
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(import.meta.dirname, '.browsers');

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
});
