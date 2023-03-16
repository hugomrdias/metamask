import { test, expect } from './fixtures.js'

test('should install and return proper response', async ({
  page,
  metamask,
}) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: 'npm:@chainsafe/filsnap',
  })

  await page.goto('/')
  await expect(page.getByText('Filsnap Testing')).toBeVisible()

  expect(result['npm:@chainsafe/filsnap']).toBeTruthy()
})

test('should get snaps', async ({ page, metamask }) => {
  await metamask.onboard()
  await metamask.installSnap({
    snapId: 'npm:@chainsafe/filsnap',
  })

  const result = await metamask.getSnaps()
  expect(result['npm:@chainsafe/filsnap']).toBeTruthy()
})

test('should install on a custom page', async ({ page, metamask, context }) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: 'npm:@chainsafe/filsnap',
    page: await context.newPage(),
  })

  expect(result['npm:@chainsafe/filsnap']).toBeTruthy()
})

test('should install on a custom version', async ({
  page,
  metamask,
  context,
}) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: 'npm:@chainsafe/filsnap',
    version: '2.3.11',
  })

  expect(result['npm:@chainsafe/filsnap'].version).toBe('2.3.11')
})
