import { createHash } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { test as base, chromium } from '@playwright/test'
import pWaitFor from 'p-wait-for'
import { download } from './download.js'
import { Metamask } from './metamask.js'
import { redirectConsole } from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  return page
}

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 * @param {number} extensionsNumber
 * @param {boolean} cacheUserDir
 */
export async function findExtensions(ctx, extensionsNumber, cacheUserDir) {
  /** @type {import('./types.js').Extension[]} */
  const extensions = []

  /** @type {string[]} */
  const urls = []

  // manifest v2
  const backgroundPages = ctx.backgroundPages()

  for (const page of backgroundPages) {
    if (page.url().includes('chrome-extension')) {
      urls.push(page.url())
    }
  }
  ctx.on('backgroundpage', (page) => {
    if (page.url().includes('chrome-extension')) {
      urls.push(page.url())
    }
  })

  // manifest v3
  const serviceWorkers = ctx.serviceWorkers()

  for (const worker of serviceWorkers) {
    if (worker.url().includes('chrome-extension')) {
      urls.push(worker.url())
    }
  }

  ctx.on('serviceworker', (worker) => {
    if (worker.url().includes('chrome-extension')) {
      urls.push(worker.url())
    }
  })

  await pWaitFor(() => urls.length === extensionsNumber)
  const extensionIds = urls.map((url) => url.split('/')[2])

  for (const id of extensionIds) {
    let page
    if (extensionIds.length > 1 || !cacheUserDir) {
      page = await findExtensionPage(ctx, id)
    } else {
      const url = `chrome-extension://${id}/home.html`
      page = await ctx.newPage()
      await page.goto(url)
    }

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
    cacheUserDir = false,
    debug = false,
    devtools = true,
  } = opts

  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let ctx

  /** @type {Metamask | undefined} */
  let mm

  const test = /** @type {import('./types').TextExtend} */ (base.extend)({
    context: async ({ headless, browser }, use) => {
      const extensionPaths = [await download(downloadOptions)]
      let dirPath = ''

      if (cacheUserDir) {
        const hash = createHash('sha256')
        hash.update(
          `${mnemonic}-${password}-${browser.browserType().name}-${browser.version}-${extensionPaths.join('-')}-${test.info().workerIndex}`
        )
        const digest = hash.digest('hex')
        dirPath = path.join(__dirname, '../.tmp', digest)
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, {
            recursive: true,
          })
        }
      }

      // https://playwright.dev/docs/service-workers-experimental
      // @ts-ignore
      process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = 1

      if (!ctx || isolated) {
        // Launch context with extension
        ctx = await chromium.launchPersistentContext(dirPath, {
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
            ...(!headless && devtools ? ['--auto-open-devtools-for-tabs'] : []),
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
      if (debug) {
        page.on('console', (msg) => redirectConsole(msg, 'Page'))
        page.on('pageerror', (err) => {
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log('[Page] Uncaught exception', err.message)
        })
        context.on('weberror', (webError) => {
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log(`[Context] Uncaught exception: "${webError.error()}"`)
        })
      }

      if (!mm || isolated) {
        if (downloadOptions.extensionsIds?.length && cacheUserDir) {
          throw new Error(
            'Cannot use extensionsIds and cacheUserDir at the same time'
          )
        }
        const extensions = await findExtensions(
          context,
          downloadOptions.extensionsIds
            ? downloadOptions.extensionsIds.length + 1
            : 1,
          cacheUserDir
        )

        mm = new Metamask(
          extensions,
          context,
          opts.downloadOptions?.flask,
          debug
        )

        if (snap) {
          if (!baseURL) {
            throw new Error(
              'No page URL provided, either set it this fixture snap config or in your playwright config with "use.baseURL"'
            )
          }
          await page.goto('/')
          await mm.setup({ mnemonic, password })
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

  const expect = test.expect
  return { test, expect }
}
