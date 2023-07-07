import Emittery from 'emittery'
import { EthereumRpcError } from 'eth-rpc-errors'
import { isValidCode } from 'eth-rpc-errors/dist/utils.js'
import pRetry from 'p-retry'

/**
 * @typedef {import('eth-rpc-errors/dist/classes.js').SerializedEthereumRpcError} SerializedEthereumRpcError
 * @typedef {{notification: import('@playwright/test').Page}} Events
 */

/**
 *
 * @param {unknown} obj
 * @returns {obj is SerializedEthereumRpcError}
 */
function isMetamaskRpcError(obj) {
  if (!obj) return false
  if (typeof obj !== 'object') return false
  if (!('code' in obj)) return false
  if (!('message' in obj)) return false

  // @ts-ignore
  if (isValidCode(obj.code)) {
    return true
  }

  return false
}

/**
 *
 * @param {import('@playwright/test').Page} page
 */
async function ensurePageLoadedURL(page) {
  if (page.url() === 'about:blank') {
    throw new Error('Go to a page first')
  }

  return page
}

/**
 * Snap approve
 *
 * @param {import('@playwright/test').Page} page
 */
async function snapApprove(page) {
  await page.getByTestId('page-container-footer-next').click()
  const isVisible = await page
    .locator('section.snap-install-warning')
    .isVisible()

  if (isVisible) {
    const checks = await page
      .locator('section.snap-install-warning')
      .getByRole('checkbox')
      .all()
    for (const check of checks) {
      await check.click()
    }
    await page.getByRole('button').filter({ hasText: 'Confirm' }).click()
  }
  await page.getByTestId('page-container-footer-next').click()
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
    return page
  }

  return pRetry(run, { retries: 5 })
}

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 */
export async function findExtensionId(ctx) {
  let [background] = ctx.backgroundPages()
  if (!background) {
    background = await ctx.waitForEvent('backgroundpage')
  }

  // Create metamask
  const extensionId = background.url().split('/')[2]

  return extensionId
}

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 * @param {string} extensionId
 */
export async function findWallet(ctx, extensionId) {
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
  await page.waitForLoadState('domcontentloaded')
  return page
}

/**
 * @param {import('@playwright/test').BrowserContext} ctx
 * @param {string} extensionId
 */
export async function findVersion(ctx, extensionId) {
  const page = await ctx.newPage()
  await page.goto(`chrome://extensions/?id=${extensionId}`)
  const version = await page
    .getByRole('heading', { name: 'Version' })
    .locator('..')
    .locator('.section-content')
    .textContent()

  await page.close()

  if (!version) {
    throw new Error('Could not find version')
  }

  return version
}

/**
 * @extends Emittery<Events>
 */
export class Metamask extends Emittery {
  /** @type {string | undefined} */
  #snap

  /**
   *
   * @param {import('@playwright/test').BrowserContext} context
   * @param {string} extensionId
   * @param {import('@playwright/test').Page} walletPage
   * @param {string} version
   */
  constructor(context, extensionId, walletPage, version) {
    super()
    this.context = context
    this.extensionId = extensionId
    this.walletPage = walletPage
    this.#snap = undefined
    this.version = version
    this.isFlask = version.includes('flask')

    this.on(Emittery.listenerAdded, async ({ listener, eventName }) => {
      if (eventName === 'notification') {
        const page = await waitNotification(this.walletPage, 'confirmation')
        this.emit('notification', page)
      }
    })
  }

  /**
   *
   * @param {string} seed
   * @param {string} password
   */
  async setup(
    seed = process.env.METAMASK_SEED ||
      'already turtle birth enroll since owner keep patch skirt drift any dinner',
    password = process.env.METAMASK_PASSWORD || '12345678'
  ) {
    // setup metamask
    const page = this.walletPage

    await page.waitForLoadState('domcontentloaded')
    if (this.isFlask) {
      await page
        .getByRole('button', { name: 'I accept the risks', exact: true })
        .click()
    }

    // import wallet
    await page.getByTestId('onboarding-terms-checkbox').click()
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
    await page.getByTestId('popover-close').click()
    return this
  }

  async teardown() {
    this.clearListeners()
    await this.context.close()
  }

  #ensureFlaskOrSnap(skipSnap = false) {
    if (!this.isFlask) {
      throw new Error('This method is only available for Flask builds.')
    }

    if (!skipSnap && !this.#snap) {
      throw new Error(
        'There\'s no snap installed yet. Run "metamask.installSnap()" first.'
      )
    }
  }

  /**
   * Install a snap
   *
   * @param {import('./types.js').InstallSnapOptions} options
   */
  async installSnap(options) {
    this.#ensureFlaskOrSnap(true)
    const rpcPage = await ensurePageLoadedURL(options.page)

    if (!options.snapId && !process.env.METAMASK_SNAP_ID) {
      throw new Error('Snap ID is required.')
    }

    const install = rpcPage.evaluate(
      async ({ snapId, version }) => {
        const api = window.ethereum
        try {
          const result = await api.request({
            method: 'wallet_requestSnaps',
            params: {
              [snapId]: {
                version: version || '*',
              },
            },
          })

          return result
        } catch (error) {
          return /** @type {error} */ (error)
        }
      },
      {
        snapId: process.env.METAMASK_SNAP_ID || options.snapId,
        version: process.env.METAMASK_SNAP_VERSION || options.version,
      }
    )
    // Snap connect popup steps
    const wallet = this.walletPage
    await waitNotification(wallet, 'snaps-connect')
    await wallet.getByTestId('snap-privacy-warning-scroll').click()
    await wallet.getByRole('button', { name: 'Accept', exact: true }).click()
    await wallet.getByRole('button').filter({ hasText: 'Connect' }).click()
    try {
      // Snap install popup steps
      await waitNotification(wallet, 'snap-install')
      await snapApprove(wallet)
    } catch {}

    const result = await install

    if (isMetamaskRpcError(result)) {
      throw new EthereumRpcError(result.code, result.message, result.data)
    }

    if (!result) {
      throw new Error(
        `Unknown RPC error: "wallet_requestSnaps" didnt return a response`
      )
    }

    this.#snap = options.snapId

    return /** @type {import('./types.js').InstallSnapsResult} */ (result)
  }

  /**
   * Install a snap
   *
   * @param {import('@playwright/test').Page} page - Page to run getSnaps
   */
  getSnaps(page) {
    this.#ensureFlaskOrSnap()
    return /** @type {Promise<import('./types.js').InstallSnapsResult>} */ (
      this.#_rpcCall(
        {
          method: 'wallet_getSnaps',
        },
        page
      )
    )
  }

  /**
   * Invoke Snap
   *
   * @template R
   *
   * @param {import('./types.js').InvokeSnapOptions} opts
   * @returns {Promise<R>}
   */
  invokeSnap(opts) {
    this.#ensureFlaskOrSnap()
    return /** @type {Promise<R>} */ (
      this.#_rpcCall(
        {
          method: 'wallet_invokeSnap',
          params: {
            snapId: this.#snap,
            request: opts.request,
          },
        },
        opts.page
      )
    )
  }

  /**
   * @template R
   *
   * @param {import('@metamask/providers/dist/BaseProvider.js').RequestArguments} arg
   * @param {import('@playwright/test').Page} page
   */
  async #_rpcCall(arg, page) {
    const rpcPage = await ensurePageLoadedURL(page)

    /** @type {Promise<R>} */
    // @ts-ignore
    const result = await rpcPage.evaluate(async (arg) => {
      const api = window.ethereum
      try {
        const result = await api.request(arg)

        return result
      } catch (error) {
        return /** @type {error} */ (error)
      }
    }, arg)

    if (isMetamaskRpcError(result)) {
      throw new EthereumRpcError(result.code, result.message, result.data)
    }

    if (!result) {
      throw new Error(`Unknown RPC error: method didnt return a response`)
    }
    return result
  }
}
