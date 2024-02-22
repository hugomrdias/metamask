import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: process.env.CI ? 60 * 1000 : 20 * 1000,
  expect: {
    timeout: 5000,
  },
  // fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  maxFailures: process.env.CI ? 2 : 0,
  retries: process.env.CI ? 2 : 1,
  // force 1 worker on local and CI because of https://github.com/hugomrdias/filsnap-testing/issues/31
  workers: 1,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: 'http://example.org',
    trace: 'on-first-retry',
    colorScheme: 'dark',
    browserName: 'chromium',
  },
})
