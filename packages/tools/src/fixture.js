import { test as base, chromium } from '@playwright/test'
import pWaitFor from 'p-wait-for'
import { download } from './download.js'
import { Metamask } from './metamask.js'

/**
 * @typedef {import('./types.js').Extension} Extension
 */

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 * @param {string} extensionId
 */
export async function findExtensionPage(ctx, extensionId) {
  let page = ctx
    .pages()
    .find((p) => p.url().startsWith(`chrome-extension://${extensionId}`))

  if (!page) {
    page = await ctx.waitForEvent('page', {
      predicate: (page) => {
        return page.url().startsWith(`chrome-extension://${extensionId}`)
      },
    })
  }
  await page.waitForLoadState('networkidle')
  return page
}

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 * @param {number} [extensionsNumber]
 */
export async function findExtensions(ctx, extensionsNumber = 1) {
  /** @type {import('./types.js').Extension[]} */
  const extensions = []

  /** @type {string[]} */
  const urls = []
  const backgroundPages = ctx.backgroundPages()

  for (const page of backgroundPages) {
    if (page.url().includes('chrome-extension')) {
      urls.push(page.url())
    }
  }

  const serviceWorkers = ctx.serviceWorkers()
  for (const worker of serviceWorkers) {
    if (worker.url().includes('chrome-extension')) {
      urls.push(worker.url())
    }
  }

  ctx.on('backgroundpage', (page) => {
    if (page.url().includes('chrome-extension')) {
      urls.push(page.url())
    }
  })

  ctx.on('serviceworker', (worker) => {
    if (worker.url().includes('chrome-extension')) {
      urls.push(worker.url())
    }
  })

  await pWaitFor(() => urls.length === extensionsNumber)
  const extensionIds = urls.map((url) => url.split('/')[2])

  for (const id of extensionIds) {
    const page = await findExtensionPage(ctx, id)
    extensions.push({
      title: await page.title(),
      url: page.url(),
      id,
      page,
    })
  }

  return extensions
}

/**
 * Create a new metamask fixture with the given options
 *
 * @param {import('./types.js').FixtureOptions} opts
 */
export function createFixture(opts = {}) {
  const {
    downloadOptions = {},
    isolated = true,
    snap,
    mnemonic,
    password,
  } = opts

  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let ctx

  /** @type {Metamask | undefined} */
  let mm

  const test = /** @type {import('./types').TextExtend} */ (base.extend)({
    context: async ({ headless }, use) => {
      const extensionPaths = [await download(downloadOptions)]

      // https://playwright.dev/docs/service-workers-experimental
      // @ts-ignore
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = 1

      if (!ctx || isolated) {
        // Launch context with extension
        ctx = await chromium.launchPersistentContext('', {
          headless,
          args: [
            ...(headless ? ['--headless=new'] : []),
            `--disable-extensions-except=${extensionPaths.join(',')}`,
            `--load-extension=${extensionPaths.join(',')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gl-drawing-for-tests',
            '--enable-automation',
            '--disable-gpu',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
            ...(headless ? [] : ['--auto-open-devtools-for-tabs']),
            // '--offscreen-document-testing',
            // '--enable-experimental-extension-apis',
          ],
        })
      }

      await use(ctx)

      if (isolated) {
        await ctx.close()
        ctx = undefined
      }
    },

    metamask: async ({ context, page, baseURL }, use) => {
      if (!mm || isolated) {
        const extensions = await findExtensions(
          context,
          downloadOptions.extensionsIds
            ? downloadOptions.extensionsIds.length + 1
            : 1
        )

        mm = new Metamask(extensions, context, opts.downloadOptions?.flask)

        if (snap) {
          if (!baseURL) {
            throw new Error(
              'No page URL provided, either set it this fixture snap config or in your playwright config with "use.baseURL"'
            )
          }
          await page.goto('/')
          await mm.setup(mnemonic, password)
          await mm.installSnap({
            page,
            id: snap.id,
            version: snap.version,
          })
        }
      }

      if (baseURL) {
        await page.goto('/')
      }

      await use(mm)

      if (isolated) {
        mm.teardown()
        mm = undefined
      }
    },
  })

  if (!isolated) {
    test.describe.configure({ mode: 'serial' })
  }

  // test.afterAll(() => {
  //   if (mm && !isolated) {
  //     mm.teardown()
  //     mm = undefined
  //   }
  // })

  const expect = test.expect
  return { test, expect }
}
