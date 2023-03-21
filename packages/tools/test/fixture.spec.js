import { test, expect } from '../src/fixture.js'
const SNAP_ID = 'npm:@chainsafe/filsnap'

test('should install and return proper response', async ({
  page,
  metamask,
}) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: SNAP_ID,
  })

  await page.goto('/')
  await expect(page.getByText('Example Domain')).toBeVisible()

  expect(result[SNAP_ID]).toBeTruthy()
})

test('should get snaps', async ({ metamask }) => {
  await metamask.onboard()
  await metamask.installSnap({
    snapId: SNAP_ID,
  })

  const result = await metamask.getSnaps()
  expect(result[SNAP_ID]).toBeTruthy()
})

test('should install on a custom page', async ({ page, metamask, context }) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: SNAP_ID,
    page: await context.newPage(),
  })

  expect(result[SNAP_ID]).toBeTruthy()
})

test('should install on a custom version', async ({
  page,
  metamask,
  context,
}) => {
  await metamask.onboard()
  const result = await metamask.installSnap({
    snapId: SNAP_ID,
    version: '2.3.11',
  })

  expect(result[SNAP_ID].version).toBe('2.3.11')
})
