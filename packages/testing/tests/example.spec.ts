import { test, expect } from './fixtures.js'

test('popup page', async ({ page, extensionId, context }) => {
  await page.goto('/')

  await expect(page.getByText('Filsnap Testing')).toBeVisible()
})
