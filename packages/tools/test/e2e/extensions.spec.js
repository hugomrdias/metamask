import { createFixture } from '../../src/fixture.js'

const password = '12345678'
const rainbowExtensionId = 'opfgelmcmbiajamepnmloijbpoleiama'

const flask = createFixture({
  downloadOptions: {
    flask: true,
    extensionsIds: [rainbowExtensionId],
  },
})

/**
 * @type {import('../../src/types.js').SetupExtraExtensionsFn}
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
      await metamask.setup({ setupExtraExtensions })

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
  },
})

main.test.describe('snaps rainbow main metamask', () => {
  main.test(
    'should install metamask when rainbow is present',
    async ({ page, metamask }) => {
      await metamask.setup({ setupExtraExtensions })

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

const main2 = createFixture({
  downloadOptions: {
    flask: true,
  },
})

main2.test.describe('snaps install metamask and filsnap', () => {
  main2.test.only(
    'should install metamask and filsnap',
    async ({ page, metamask }) => {
      await metamask.setup()

      const snapId = 'npm:filsnap'
      const result = await metamask.installSnap({
        id: snapId,
        page,
      })

      await main2.expect(page.getByText('Example Domain')).toBeVisible()
      main2.expect(result[snapId].id).toBe(snapId)

      metamask.waitForDialog('confirmation').then(async (page) => {
        await page.getByTestId('confirmation-submit-button').click()
      })

      const config = await metamask.invokeSnap({
        request: {
          method: 'fil_configure',
          params: {
            network: 'testnet',
          },
        },
        page,
      })

      main2.expect(config.result).toEqual({
        derivationPath: "m/44'/1'/0'/0/0",
        rpc: { url: 'https://api.calibration.node.glif.io', token: '' },
        network: 'testnet',
        unit: { decimals: 18, symbol: 'tFIL' },
      })
    }
  )
})
