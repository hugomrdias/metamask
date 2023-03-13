import { test } from './fixtures.js'

test('popup page', async ({ page, extensionId, context }) => {
  await page.goto('https://filsnap.chainsafe.io')
  await page.pause()
})
