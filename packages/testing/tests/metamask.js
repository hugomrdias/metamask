import pRetry from 'p-retry'

/**
 * Snap approve
 *
 * @param {import('@playwright/test').Page} page
 */
async function snapApprove(page) {
  await page
    .getByRole('button')
    .filter({ hasText: 'Approve & install' })
    .click()
  await page.getByLabel('Test Networks').click()
  await page.getByLabel('Filecoin key').click()
  await page.getByRole('button').filter({ hasText: 'Confirm' }).click()
}

/**
 * Wait for a metamask notification
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
function waitNotification(page, name) {
  async function run() {
    if (!page.url().includes(name)) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      throw new Error('not yet')
    }
  }

  return pRetry(run, { retries: 5, factor: 1 })
}

export class Metamask {
  /**
   *
   * @param {import('@playwright/test').BrowserContext} context
   * @param {string} extensionId
   */
  constructor(context, extensionId) {
    this.context = context
    this.extensionId = extensionId
    this.walletPage = undefined
  }

  /**
   *
   * @param {string} seed
   * @param {string} password
   */
  async onboard(
    seed = 'already turtle birth enroll since owner keep patch skirt drift any dinner',
    password = '12345678'
  ) {
    // setup metamask

    const page = await this.wallet()

    await page.getByText('accept').click()

    // import wallet
    await page.getByTestId('onboarding-import-wallet').click()
    await page.getByTestId('metametrics-no-thanks').click()

    for (const [index, seedPart] of seed.split(' ').entries()) {
      await page.getByTestId(`import-srp__srp-word-${index}`).type(seedPart)
    }
    await page.getByTestId('import-srp-confirm').click()
    await page.getByTestId('create-password-new').type(password)
    await page.getByTestId('create-password-confirm').type(password)
    await page.getByTestId('create-password-terms').click()
    await page.getByTestId('create-password-import').click()
    await page.getByTestId('onboarding-complete-done').click()
    await page.getByTestId('pin-extension-next').click()
    await page.getByTestId('pin-extension-done').click()

    return this
  }

  async wallet() {
    if (!this.walletPage) {
      const page = this.context
        .pages()
        .find((p) => p.url().startsWith('chrome-extension://'))
      this.walletPage =
        page ||
        (await this.context.waitForEvent('page', {
          predicate: (page) => {
            return page.url().startsWith('chrome-extension://')
          },
        }))
    }

    await this.walletPage.waitForLoadState('domcontentloaded')

    await this.walletPage.bringToFront()
    // await this.walletPage.goto(
    //   `chrome-extension://${this.extensionId}/home.html`,
    //   { waitUntil: 'domcontentloaded' }
    // )

    return this.walletPage
  }

  /**
   *
   * @param {import('@playwright/test').Page} testPage
   */
  async installSnap(testPage) {
    // navigate to another page to get window.ethereum
    const page = await this.context.newPage()

    await page.goto('http://example.org')
    const install = page.evaluate(
      ({ snapId, version }) => {
        const api =
          /** @type {import('@metamask/providers').MetaMaskInpageProvider} */ (
            window.ethereum
          )
        return api.request({
          method: 'wallet_requestSnaps',
          params: {
            [snapId]: {
              version: version ?? 'latest',
            },
          },
        })
      },
      { snapId: 'npm:@chainsafe/filsnap', version: undefined }
    )

    // Snap popup steps
    const wallet = await this.wallet()

    await waitNotification(wallet, 'confirm-permissions')
    await wallet.getByRole('button').filter({ hasText: 'Connect' }).click()
    await waitNotification(wallet, 'snap-install')
    await snapApprove(wallet)

    const result = await install

    await page.close({ runBeforeUnload: true })

    await testPage.bringToFront()

    return /** @type {import('./types').InstallSnapResult} */ (result)
  }
}
