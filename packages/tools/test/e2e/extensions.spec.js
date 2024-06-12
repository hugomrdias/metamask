import { createFixture } from '../../src/fixture.js'

const password = '12345678'
const rainbowExtensionId = 'opfgelmcmbiajamepnmloijbpoleiama'

const flask = createFixture({
  downloadOptions: {
    flask: true,
    extensionsIds: [rainbowExtensionId],
    tag: 'v11.16.5',
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

flask.test.describe('snaps rainbow flask metamask', () => {
  flask.test(
    'should install metamask when rainbow is present',
    async ({ page, metamask }) => {
      await metamask.setup()
      await metamask.setupExtraExtensions(setupExtraExtensions)

      const snapId = 'npm:@metamask/test-snap-dialog'
      const result = await metamask.installSnap({
        id: snapId,
        page,
      })

      await flask.expect(page.getByText('Example Domain')).toBeVisible()
      flask.expect(result[snapId].id).toBe(snapId)
    }
  )
})

const main = createFixture({
  downloadOptions: {
    extensionsIds: [rainbowExtensionId],
    tag: 'v11.16.5',
  },
})

main.test.describe('snaps rainbow main metamask', () => {
  main.test(
    'should install metamask when rainbow is present',
    async ({ page, metamask }) => {
      await metamask.setup()
      await metamask.setupExtraExtensions(setupExtraExtensions)

      const snapId = 'npm:filsnap'
      const result = await metamask.installSnap({
        version: '1.0.2',
        id: snapId,
        page,
      })

      await main.expect(page.getByText('Example Domain')).toBeVisible()
      main.expect(result[snapId].id).toBe(snapId)
    }
  )
})
