/* eslint-disable no-console */
import { test as base, chromium } from '@playwright/test'
import { download } from './download.js'
import {
  Metamask,
  findExtensionId,
  findVersion,
  findWallet,
} from './metamask.js'

/**
 * @param {import('./types.js').FixtureOptions} opts
 */
export function createFixture(opts = {}) {
  const {
    download: downloadOptions = {},
    isolated = true,
    snap,
    seed,
    password,
  } = opts

  /** @type {import('@playwright/test').BrowserContext} */
  let ctx

  /** @type {Metamask} */
  let model

  const test = /** @type {import('./types').TextExtend} */ (base.extend)({
    context: async ({ headless }, use) => {
      console.log(process.env.METAMASK_TAG)
      console.log(process.env.METAMASK_SEED)
      console.log(process.env.METAMASK_PASSWORD)
      console.log(process.env.METAMASK_SNAP_ID)
      console.log(process.env.METAMASK_SNAP_VERSION)
      console.log(process.env.METAMASK_SNAP_VERSION22)
      const pathToExtension = await download(downloadOptions)

      if (!ctx || isolated) {
        // Launch context with extension
        ctx = await chromium.launchPersistentContext('', {
          headless,
          args: [
            ...(headless ? ['--headless=new'] : []),
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
          ],
        })
      }

      await use(ctx)
      if (isolated) {
        await ctx.close()
      }
    },

    metamask: async ({ context, page, baseURL }, use) => {
      if (baseURL) {
        await page.goto(baseURL)
      }

      if (!model || isolated) {
        const extensionId = await findExtensionId(context)
        model = new Metamask(
          context,
          extensionId,
          await findWallet(context, extensionId),
          await findVersion(context, extensionId)
        )

        if (snap) {
          await model.setup(seed, password)
          await model.installSnap({ page, ...snap })
        }
      }

      await use(model)
      model.clearListeners()
    },
  })

  if (!isolated) {
    test.describe.configure({ mode: 'serial' })
  }
  const expect = test.expect
  return { test, expect }
}
