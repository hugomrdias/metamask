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
    download: downloadOptions = { extensions: [] },
    isolated = true,
    snap,
    mnemonic,
    password,
  } = opts

  if (!downloadOptions.extensions) {
    downloadOptions.extensions = []
  }

  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let ctx

  /** @type {Metamask | undefined} */
  let model

  const test = /** @type {import('./types').TextExtend} */ (base.extend)({
    context: async ({ headless }, use) => {
      const extensionPaths = [await download(downloadOptions)]

      if (!ctx || isolated) {
        // Launch context with extension
        ctx = await chromium.launchPersistentContext('', {
          headless,
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
          args: [
            ...(headless ? ['--headless=new'] : []),
            `--disable-extensions-except=${extensionPaths.join(',')}`,
            `--load-extension=${extensionPaths.join(',')}`,
          ],
        })
      }

      await use(ctx)
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
        await page.goto('/')
      }
      await use(model)
      if (isolated) {
        await model.teardown()
        model = undefined
        ctx = undefined
      }
    },

    extraExtensions: async ({ context }, use) => {
      const data = {}
      const page = await context.newPage()
      const client = await context.newCDPSession(page)

      const { targetInfos } = await client.send('Target.getTargets')
      // Filter the targets to find extensions. This might require custom logic based on your needs.
      const extensionTargets = targetInfos.filter((target) =>
        target.url.includes('chrome-extension://')
      )

      await page.close()
      // @ts-ignore
      // eslint-disable-next-line no-unused-vars
      for (const ext of downloadOptions.extensions) {
        // the passed extensionId and the installed extensionId are different,
        // this is because chrome generates a uniq id based on the absolute
        // path extension location on fs
        const target = extensionTargets.find(
          (target) => target.title === ext.title
        )
        const installedExtensionId = target?.url.split('/')[2]

        // @ts-ignore
        data[ext.id] = {
          id: installedExtensionId,
          // @ts-ignore
          page: await ext.findPage(context, installedExtensionId),
        }
      }

      /**
       * @param {(arg0: {}) => any} fn
       */
      async function callback(fn) {
        return await fn(data)
      }

      await use(callback)
    },
  })

  if (!isolated) {
    test.describe.configure({ mode: 'serial' })
  }

  test.afterAll(async () => {
    if (model && !isolated) {
      await model.teardown()
      model = undefined
      ctx = undefined
    }
  })
  const expect = test.expect
  return { test, expect }
}
