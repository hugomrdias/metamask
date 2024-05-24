import { createFixture } from '../../src/fixture.js'

const password = '12345678'
const rainbowExtensionId = 'opfgelmcmbiajamepnmloijbpoleiama'

const { test, expect } = createFixture({
  downloadOptions: {
    flask: true,
    extensionsIds: [rainbowExtensionId],
  },
})

/**
 * @param {import('../../src/types.js').Extension[]} data
 */
async function setupExtraExtensions(data) {
  for (const extension of data) {
    if (extension.title === 'Rainbow Wallet') {
      const page = extension.page
      await page.getByTestId('create-wallet-button').click()
      await page.getByTestId('skip-button').click()
      await page.getByTestId('password-input').fill(password)
      await page.getByTestId('confirm-password-input').fill(password)
      await page.getByTestId('set-password-button').click()
    }
  }
}

test.describe('snaps rainbow', () => {
  test('should install metamask when rainbow is present', async ({
    page,
    metamask,
  }) => {
    await metamask.setup()
    await metamask.setupExtraExtensions(setupExtraExtensions)

    const snapId = 'npm:@metamask/test-snap-dialog'
    const result = await metamask.installSnap({
      id: snapId,
      page,
    })

    await expect(page.getByText('Example Domain')).toBeVisible()
    expect(result[snapId].id).toBe(snapId)
  })
})
