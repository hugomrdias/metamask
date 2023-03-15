import { test, expect } from './fixtures.js'

test('popup page', async ({ page, metamask }) => {
  await metamask.onboard()
  const result = await metamask.installSnap(page)

  await page.goto('/')
  await expect(page.getByText('Filsnap Testing')).toBeVisible()

  expect(result['npm:@chainsafe/filsnap']).toBeTruthy()
})
