import { defineConfig } from '@playwright/test'

export default defineConfig({
  name: 'tools',
  testDir: './test/e2e',
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: 'http://example.org',
    trace: 'on-first-retry',
    colorScheme: 'dark',
    browserName: 'chromium',
  },
})
