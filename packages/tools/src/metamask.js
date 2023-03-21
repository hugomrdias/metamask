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
    await page.goto('https://example.org')
  }
  await page.bringToFront()

  return page
}

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

/**
 * @extends Emittery<Events>
 */
export class Metamask extends Emittery {
  /** @type {import('@playwright/test').Page | undefined} */
  #walletPage

  /**
   *
   * @param {import('@playwright/test').BrowserContext} context
   * @param {string} extensionId
   * @param {import('@playwright/test').Page} testPage
   */
  constructor(context, extensionId, testPage) {
    super()
    this.context = context
    this.extensionId = extensionId
    this.testPage = testPage
    this.#walletPage = undefined

    this.on(Emittery.listenerAdded, ({ listener, eventName }) => {
      if (eventName === 'notification') {
        this.#walletPage?.on('framenavigated', (frame) => {
          if (
            frame.url() ===
            `chrome-extension://${extensionId}/home.html#confirmation`
          ) {
            this.emit('notification', frame.page())
          }
        })
        this.#walletPage?.reload()
      }
    })
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

  /**
   * Get metamask page
   */
  async wallet() {
    if (!this.#walletPage) {
      const page = this.context
        .pages()
        .find((p) =>
          p.url().startsWith(`chrome-extension://${this.extensionId}`)
        )
      this.#walletPage =
        page ||
        (await this.context.waitForEvent('page', {
          predicate: (page) => {
            return page
              .url()
              .startsWith(`chrome-extension://${this.extensionId}`)
          },
        }))
      await this.#walletPage.waitForLoadState('domcontentloaded')
    }

    await this.#walletPage.bringToFront()

    return this.#walletPage
  }

  /**
   * Install a snap
   *
   * @param {import('./types.js').InstallSnapOptions} options
   */
  async installSnap(options) {
    const rpcPage = await ensurePageLoadedURL(options.page ?? this.testPage)

    const install = rpcPage.evaluate(
      async ({ snapId, version }) => {
        const api = window.ethereum
        try {
          const result = await api.request({
            method: 'wallet_requestSnaps',
            params: {
              [snapId]: {
                version: version ?? 'latest',
              },
            },
          })

          return result
        } catch (error) {
          return /** @type {error} */ (error)
        }
      },
      { snapId: options.snapId, version: options.version }
    )
    // Snap popup steps
    const wallet = await this.wallet()
    await waitNotification(wallet, 'confirm-permissions')
    await wallet.getByRole('button').filter({ hasText: 'Connect' }).click()
    try {
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

    await this.testPage.bringToFront()
    return /** @type {import('./types.js').InstallSnapsResult} */ (result)
  }

  /**
   * Install a snap
   *
   * @param {import('@playwright/test').Page} [page] - Page to run getSnaps
   */
  getSnaps(page) {
    return /** @type {Promise<import('./types.js').InstallSnapsResult>} */ (
      this._rpcCall(
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
  async invokeSnap(opts) {
    return /** @type {Promise<R>} */ (
      this._rpcCall(
        {
          method: 'wallet_invokeSnap',
          params: {
            snapId: opts.snapId,
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
   * @param {import('@playwright/test').Page} [page]
   */
  async _rpcCall(arg, page) {
    const rpcPage = await ensurePageLoadedURL(page ?? this.testPage)

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

    await this.testPage.bringToFront()
    return result
  }
}
