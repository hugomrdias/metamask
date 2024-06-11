import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: process.env.CI ? 120 * 1000 : 30 * 1000,
  expect: {
    timeout: 5000,
  },
  forbidOnly: Boolean(process.env.CI),
  // maxFailures: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://example.org',
    trace: 'on-first-retry',
    colorScheme: 'dark',
    browserName: 'chromium',
  },
})
