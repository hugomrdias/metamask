import { defineConfig } from '@playwright/test'

export default defineConfig({
  name: 'tools',
  testDir: './test/e2e',
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  maxFailures: process.env.CI ? 0 : 1,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    colorScheme: 'dark',
    browserName: 'chromium',
  },
  webServer: [
    {
      command: 'pnpm run serve-static',
      url: 'http://localhost:8081',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
