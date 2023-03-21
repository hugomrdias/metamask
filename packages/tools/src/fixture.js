import { test as base, chromium } from '@playwright/test'
import { download } from './download.js'
import { Metamask } from './metamask.js'

/**
 * @typedef {import('@playwright/test').PlaywrightTestArgs} PlaywrightTestArgs
 * @typedef {import('@playwright/test').PlaywrightWorkerArgs} PlaywrightWorkerArgs
 */

/** @type {import('@playwright/test').TestType<PlaywrightTestArgs & {
    metamask: import('./metamask.js').Metamask
}, PlaywrightWorkerArgs>} */
export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  context: async ({ headless }, use) => {
    const pathToExtension = await download({
      repo: 'MetaMask/metamask-extension',
      tag: 'latest',
      asset: 'metamask-flask-chrome-[tag]-flask.0',
    })

    // Launch context with extension
    const context = await chromium.launchPersistentContext('', {
      headless,
      args: [
        // '--window-size=1920,1080',
        ...(headless ? ['--headless=new'] : []),
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })

    await use(context)
    await context.close()
  },

  // @ts-ignore
  metamask: async ({ context, page }, use) => {
    let [background] = context.backgroundPages()
    if (!background) {
      background = await context.waitForEvent('backgroundpage')
    }

    // Create metamask
    const extensionId = background.url().split('/')[2]
    await page.goto('/')
    const metamask = new Metamask(context, extensionId, page)

    await use(metamask)
    metamask.clearListeners()
  },
})
export const expect = test.expect
