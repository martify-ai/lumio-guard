import { defineConfig } from 'vitest/config';

// Unit tests only. Browser tests in tests/e2e run with Playwright.
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
