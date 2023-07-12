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
    mnemonic,
    password,
  } = opts

  /** @type {import('@playwright/test').BrowserContext} */
  let ctx

  /** @type {Metamask} */
  let model

  const test = /** @type {import('./types').TextExtend} */ (base.extend)({
    context: async ({ headless }, use) => {
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
      if (!model || isolated) {
        const extensionId = await findExtensionId(context)
        model = new Metamask(
          context,
          extensionId,
          await findWallet(context, extensionId),
          await findVersion(context, extensionId)
        )

        if (snap) {
          const pageURL = snap && snap.url ? snap.url : baseURL
          if (!pageURL) {
            throw new Error(
              'No page URL provided, either set it this fixture snap config or in your playwright config with "use.baseURL"'
            )
          }
          await model.setup(mnemonic, password)
          await model.installSnap({
            url: pageURL,
            id: snap.id,
            version: snap.version,
          })
        }
      }

      if (baseURL) {
        await page.goto(baseURL)
      }
      await use(model)
      if (isolated && model) {
        model.clearListeners()
      }
    },
  })

  if (!isolated) {
    test.describe.configure({ mode: 'serial' })
  }

  test.afterAll(async () => {
    if (model) {
      await model.teardown()
    }
    if (ctx) {
      await ctx.close()
    }
  })
  const expect = test.expect
  return { test, expect }
}
