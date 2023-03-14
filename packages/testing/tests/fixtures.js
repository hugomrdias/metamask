import { test as base, chromium } from '@playwright/test'
import { download } from 'filsnap-testing-tools'

/**
 * @typedef {import('@playwright/test').PlaywrightTestArgs} PlaywrightTestArgs
 * @typedef {import('@playwright/test').PlaywrightTestOptions} PlaywrightTestOptions
 * @typedef {import('@playwright/test').PlaywrightWorkerArgs} PlaywrightWorkerArgs
 * @typedef {import('@playwright/test').PlaywrightWorkerOptions} PlaywrightWorkerOptions
 * @typedef {import('@playwright/test').BrowserContext} BrowserContext
 * @typedef {import('@playwright/test').TestType<PlaywrightTestArgs & PlaywrightTestOptions & {
    context: BrowserContext;
    extensionId: string;
}, PlaywrightWorkerArgs & PlaywrightWorkerOptions>} TestType
 */

const seed =
  'already turtle birth enroll since owner keep patch skirt drift any dinner'
const password = '12345678'

/** @type {TestType} */
export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = await download({
      repo: 'MetaMask/metamask-extension',
      tag: 'latest',
      asset: 'metamask-flask-chrome-[tag]-flask.0',
    })
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        // `--headless=new`,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.backgroundPages()
    if (!background) background = await context.waitForEvent('backgroundpage')

    const extensionId = background.url().split('/')[2]
    await context.waitForEvent('page')

    await use(extensionId)
  },

  page: async ({ context, extensionId }, use) => {
    // setup metamask
    const page = await context.newPage()
    await page.goto(
      `chrome-extension://${extensionId}/home.html#onboarding/experimental-area`,
      { waitUntil: 'domcontentloaded' }
    )

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

    // navigate to another page to get window.ethereum
    const snapPage = await context.newPage()
    await snapPage.goto('http://example.org')
    await snapPage.evaluate(
      ({ snapId, version }) => {
        window.ethereum.request({
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
    const connect = await context.waitForEvent('page')
    await connect.waitForLoadState()
    await connect.getByRole('button').filter({ hasText: 'Connect' }).click()

    await Promise.allSettled([snapApprove, snapWaitApprove])

    // create new empty page for tests
    await use(await context.newPage())
  },
})
export const expect = test.expect

/**
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
 *
 */
async function snapWaitApprove() {
  const page = await context.waitForEvent('page')
  await page.waitForLoadState()
  await snapApprove(page)
}
