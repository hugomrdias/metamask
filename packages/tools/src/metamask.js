import Emittery from 'emittery'
import { EthereumRpcError } from 'eth-rpc-errors'
import { isValidCode } from 'eth-rpc-errors/dist/utils.js'
import pRetry from 'p-retry'

const DEFAULT_MNEMONIC =
  process.env.METAMASK_MNEMONIC ||
  'already turtle birth enroll since owner keep patch skirt drift any dinner'
const DEFAULT_PASSWORD = process.env.METAMASK_PASSWORD || '12345678'

/**
 * @typedef {import('eth-rpc-errors/dist/classes.js').SerializedEthereumRpcError} SerializedEthereumRpcError
 * @typedef {{notification: import('@playwright/test').Page, 'snaps-connect': import('@playwright/test').Page}} Events
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
function ensurePageLoadedURL(page) {
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
  const warning = page.getByRole('dialog')

  if (await warning.isVisible()) {
    const checks = await warning.getByRole('checkbox').all()
    for (const check of checks) {
      await check.click()
    }
    await warning.getByRole('button').filter({ hasText: 'Confirm' }).click()
  }
  await page.getByRole('button').filter({ hasText: 'OK' }).click()
}

/**
 * Wait for a metamask notification
 * @param {import('@playwright/test').Page} page - Metamask page to wait for notification
 * @param {string} name
 */
async function waitForDialog(page, name) {
  await page.reload()
  async function run() {
    if (!page.url().includes(name)) {
      await page.reload()
      throw new Error(`Could not find dialog "${name}" from page ${page.url()}`)
    }
    return page
  }

  return pRetry(run, { retries: 3 })
}

/**
 * @extends Emittery<Events>
 */
export class Metamask extends Emittery {
  /** @type {string | undefined} */
  #snap

  /**
   * @param {import('./types.js').Extension[]} extensions
   * @param {import("@playwright/test").BrowserContext} context
   */
  constructor(extensions, context) {
    super()

    this.context = context
    this.extension = extensions.find((ext) => ext.title === 'MetaMask')
    if (!this.extension) {
      throw new Error('MetaMask extension not found')
    }
    this.page = this.extension.page
    this.extraExtensions = extensions.filter((ext) => ext.title !== 'MetaMask')
    this.#snap = undefined

    this.on(Metamask.listenerAdded, async ({ eventName }) => {
      if (eventName === 'notification') {
        const page = await this.waitForDialog('confirmation')
        this.emit('notification', page)
      } else if (eventName) {
        const page = await this.waitForDialog(eventName?.toString())
        // @ts-ignore
        this.emit(eventName, page)
      }
    })
  }

  /**
   * Wait for a dialog
   *
   * @param {string} name - String to match against the dialog url
   */
  waitForDialog(name) {
    return waitForDialog(this.page, name)
  }

  /**
   * @param {(arg0: import("./types.js").Extension[]) => Promise<void>} fn
   */
  setupExtraExtensions(fn) {
    return fn(this.extraExtensions)
  }

  /**
   * Setup Metamask with a mnemonic and password
   *
   * @param {string} mnemonic
   * @param {string} password
   */
  async setup(mnemonic = DEFAULT_MNEMONIC, password = DEFAULT_PASSWORD) {
    const page = this.page

    // flask warning
    const experimental = page.getByTestId('experimental-area')
    if ((await experimental.count()) > 0) {
      await experimental
        .getByRole('button', { name: 'I accept the risks', exact: true })
        .click()
    }

    // import wallet
    await page.getByTestId('onboarding-terms-checkbox').click()
    await page.getByTestId('onboarding-import-wallet').click()
    await page.getByTestId('metametrics-no-thanks').click()

    for (const [index, seedPart] of mnemonic.split(' ').entries()) {
      await page.getByTestId(`import-srp__srp-word-${index}`).fill(seedPart)
    }
    await page.getByTestId('import-srp-confirm').click()
    await page.getByTestId('create-password-new').fill(password)
    await page.getByTestId('create-password-confirm').fill(password)
    await page
      .getByTestId('create-password-terms')
      .click({ force: true, noWaitAfter: true })
    await page
      .getByTestId('create-password-import')
      .click({ force: true, noWaitAfter: true })
    await page
      .getByTestId('onboarding-complete-done')
      .click({ force: true, noWaitAfter: true })
    await page
      .getByTestId('pin-extension-next')
      .click({ force: true, noWaitAfter: true })
    await page
      .getByTestId('pin-extension-done')
      .click({ force: true, noWaitAfter: true })
    return this
  }

  teardown() {
    this.clearListeners()
  }

  #ensureSnap() {
    if (!this.#snap) {
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
    if (!options.id && !process.env.METAMASK_SNAP_ID) {
      throw new Error('Snap ID is required.')
    }

    const install = options.page.evaluate(
      async ({ snapId, version }) => {
        const getRequestProvider = () => {
          return new Promise((resolve) => {
            // Define the event handler directly. This assumes the window is already loaded.
            // @ts-ignore
            const handler = (event) => {
              const { rdns } = event.detail.info

              switch (rdns) {
                case 'io.metamask':
                case 'io.metamask.flask':
                case 'io.metamask.mmi': {
                  window.removeEventListener(
                    'eip6963:announceProvider',
                    handler
                  )
                  resolve(event.detail.provider)
                  break
                }
                default: {
                  break
                }
              }
            }

            window.addEventListener('eip6963:announceProvider', handler)
            window.dispatchEvent(new Event('eip6963:requestProvider'))
          })
        }

        try {
          const api = await getRequestProvider()
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
        snapId: process.env.METAMASK_SNAP_ID || options.id,
        version: process.env.METAMASK_SNAP_VERSION || options.version,
      }
    )
    // Snap connect popup steps
    const wallet = this.page
    try {
      await this.waitForDialog('snaps-connect')
      await wallet.getByTestId('snap-privacy-warning-scroll').click()
      await wallet.getByRole('button', { name: 'Accept', exact: true }).click()
      await wallet.getByRole('button').filter({ hasText: 'Connect' }).click()
      // Snap install popup steps
      await this.waitForDialog('snap-install')
      await snapApprove(wallet)
    } catch {
      // ignore
    }

    const result = await install

    if (isMetamaskRpcError(result)) {
      throw new EthereumRpcError(result.code, result.message, result.data)
    }

    if (!result) {
      throw new Error(
        `Unknown RPC error: "wallet_requestSnaps" didnt return a response`
      )
    }

    this.#snap = process.env.METAMASK_SNAP_ID || options.id

    return /** @type {import('./types.js').InstallSnapsResult} */ (result)
  }

  /**
   * Get snaps
   *
   * @param {import('@playwright/test').Page} page - Page to run getSnaps
   */
  getSnaps(page) {
    this.#ensureSnap()
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
   * Get version
   *
   * @param {import('@playwright/test').Page} page - Page to run getVersion
   */
  getVersion(page) {
    return this.#_rpcCall(
      {
        method: 'web3_clientVersion',
        params: [],
      },
      page
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
    this.#ensureSnap()
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
   * @param {import('@metamask/providers').RequestArguments} arg
   * @param {import('@playwright/test').Page} page
   */
  async #_rpcCall(arg, page) {
    const rpcPage = ensurePageLoadedURL(page)

    /** @type {Promise<R>} */
    // @ts-ignore
    const result = await rpcPage.evaluate(async (arg) => {
      const getRequestProvider = () => {
        return new Promise((resolve) => {
          // Define the event handler directly. This assumes the window is already loaded.
          // @ts-ignore
          const handler = (event) => {
            const { rdns } = event.detail.info
            switch (rdns) {
              case 'io.metamask':
              case 'io.metamask.flask':
              case 'io.metamask.mmi': {
                window.removeEventListener('eip6963:announceProvider', handler)
                resolve(event.detail.provider)
                break
              }
              default: {
                // Optionally reject or resolve with null/undefined if no provider is found.
                break
              }
            }
          }

          window.addEventListener('eip6963:announceProvider', handler)
          window.dispatchEvent(new Event('eip6963:requestProvider'))
        })
      }
      try {
        const api = await getRequestProvider()
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
      throw new Error('Unknown RPC error: method didnt return a response')
    }
    return result
  }
}
