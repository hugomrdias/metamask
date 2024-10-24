import { createFixture } from '../../src/fixture.js'

const { test, expect } = createFixture({
  downloadOptions: {
    flask: true,
  },
})
const SNAP_ID = 'npm:@metamask/test-snap-bip32'

test.describe('snaps', () => {
  test('should install with warning', async ({ page, metamask }) => {
    await metamask.setup()

    const result = await metamask.installSnap({
      id: SNAP_ID,
      page,
    })

    await expect(page.getByText('Example Domain')).toBeVisible()

    expect(result[SNAP_ID].id).toBe(SNAP_ID)
  })

  test('should install without warning', async ({ page, metamask }) => {
    await metamask.setup()
    const snapId = 'npm:@metamask/test-snap-dialog'
    const result = await metamask.installSnap({
      id: snapId,
      page,
    })

    await expect(page.getByText('Example Domain')).toBeVisible()

    expect(result[snapId].id).toBe(snapId)
  })

  test('should get snaps', async ({ metamask, page }) => {
    await metamask.setup()
    await metamask.installSnap({
      id: SNAP_ID,
      page,
    })

    const result = await metamask.getSnaps(page)
    expect(result[SNAP_ID]).toBeTruthy()
  })

  test('should install on a custom page', async ({ metamask, context }) => {
    await metamask.setup()
    const page = await context.newPage()
    await page.goto('/')
    const result = await metamask.installSnap({
      id: SNAP_ID,
      page,
    })

    expect(result[SNAP_ID]).toBeTruthy()
  })

  test('should install on a custom version', async ({ page, metamask }) => {
    await metamask.setup()
    const result = await metamask.installSnap({
      id: SNAP_ID,
      version: '5.4.0',
      page,
    })

    expect(result[SNAP_ID].version).toBe('5.4.0')
  })

  test('should install filsnap and update with another install', async ({
    page,
    metamask,
  }) => {
    await metamask.setup()
    await metamask.installSnap({
      id: 'npm:filsnap',
      version: '1.0.3',
      page,
    })

    const update = await metamask.installSnap({
      id: 'npm:filsnap',
      version: '1.1.0',
      page,
    })

    expect(update['npm:filsnap'].version).toBe('1.1.0')
  })
})
