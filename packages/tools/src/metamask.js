import { EthereumRpcError } from 'eth-rpc-errors'
import pRetry from 'p-retry'

import { ensurePageLoadedURL, isMetamaskRpcError } from './utils.js'

const DEFAULT_MNEMONIC =
  process.env.METAMASK_MNEMONIC ||
  'already turtle birth enroll since owner keep patch skirt drift any dinner'
const DEFAULT_PASSWORD = process.env.METAMASK_PASSWORD || '12345678'

/**
 * @typedef {{confirmation: import('@playwright/test').Page, 'snaps-connect': import('@playwright/test').Page, error: Error}} Events
 */

/**
 * Snap approve
 *
 * @param {import('@playwright/test').Page} page
 */
async function snapApprove(page) {
  if (page.url().includes('snap-update')) {
    await page.getByTestId('page-container-footer-next').click()
    await page.getByTestId('page-container-footer-next').click()
    return
  }
  // snaps connect
  await page.getByTestId('snap-privacy-warning-scroll').click()
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await page.getByTestId('page-container-footer-next').click()

  // snap install
  await page.waitForURL('**/snap-install')
  await page.getByTestId('page-container-footer-next').click()
  const warning = page.getByRole('dialog')

  if (await warning.isVisible()) {
    const checks = await warning.getByRole('checkbox').all()
    for (const check of checks) {
      await check.click()
    }
    await warning.getByTestId('snap-install-warning-modal-confirm').click()
  }
  await page.waitForURL('**/snap-install-result')
  await page.getByTestId('page-container-footer-next').click()
}

/**
 * Wait for a metamask notification
 *
 *
 * @param {import('@playwright/test').Page} page - Metamask page to wait for notification
 * @param {string | RegExp | ((url: URL) => boolean)} name - A glob pattern, regex pattern or predicate receiving [URL] to match while waiting for the navigation. Note that if the parameter is a string without wildcard characters, the method will wait for navigation to URL that is exactly equal to the string.
 * @param {string} extension - extension homepage
 */
function waitForDialog(page, name, extension) {
  async function run() {
    await page.goto(extension)
    await page.waitForURL(name, { timeout: 1000 })
    return page
  }

  return pRetry(run, {
    retries: 3,
    factor: 1,
  })
}

/**
 */
export class Metamask {
  /** @type {string | undefined} */
  #snap

  /** @type {import('@playwright/test').Page} */
  page

  /**
   * @param {import('./types.js').Extension[]} extensions
   * @param {import("@playwright/test").BrowserContext} context
   * @param {boolean} [isFlask]
   */
  constructor(extensions, context, isFlask = false) {
    this.isFlask = isFlask
    this.context = context
    this.extension = extensions.find((ext) => ext.title === 'MetaMask')

    if (!this.extension) {
      throw new Error('MetaMask extension not found')
    }
    this.extraExtensions = extensions.filter((ext) => ext.title !== 'MetaMask')
    this.#snap = undefined
    this.page = this.extension.page

    // this.#page.on('console', redirectConsole)
    // this.#page.on('pageerror', (err) => {
    //   console.log('Wallet Page Uncaught exception', err.message)
    // })

    // context.on('request', async (request) => {
    //   if (
    //     request.url().includes('acl.execution.metamask.io/latest/registry.json')
    //   ) {
    //     console.log('REGISTRY', request.url())
    //     console.log('HEADERS', await request.allHeaders())
    //   }
    // })

    // context.on('response', async (response) => {
    //   if (
    //     response
    //       .url()
    //       .includes('acl.execution.metamask.io/latest/registry.json')
    //   ) {
    //     console.log(response.url())

    //     console.log('BODY', await response.text())
    //     console.log('HEADERS', await response.allHeaders())
    //   }
    // })
  }

  /**
   * Wait for a dialog
   *
   * @param {string | RegExp | ((url: URL) => boolean)} name - A glob pattern, regex pattern or predicate receiving [URL] to match while waiting for the navigation. Note that if the parameter is a string without wildcard characters, the method will wait for navigation to URL that is exactly equal to the string.
   */
  waitForDialog(name) {
    return waitForDialog(this.page, name, this.extension.url)
  }

  /**
   * Wait for metamask confirmation dialog to appear and confirm or cancel
   *
   * @param {boolean} [confirm=true]
   */
  async waitForConfirmation(confirm = true) {
    const page = await this.waitForDialog((url) => {
      return url.hash.includes('confirmation')
    })
    if (confirm) {
      await page.getByTestId('confirmation-submit-button').click()
    } else {
      await page.getByTestId('confirmation-cancel-button').click()
    }
  }

  /**
   * Setup Metamask with a mnemonic and password
   *
   * @param {import('./types.js').SetupOptions} options
   */
  async setup(options = {}) {
    const { mnemonic = DEFAULT_MNEMONIC, password = DEFAULT_PASSWORD } = options

    const page = this.page

    if (options.setupExtraExtensions) {
      await options.setupExtraExtensions(this.extraExtensions)
    }

    if (this.isFlask) {
      // flask warning
      await page
        .getByTestId('experimental-area')
        .getByRole('button', { name: 'I accept the risks', exact: true })
        .click()
    }
    // import wallet
    await page.waitForURL('**/welcome')
    await page.getByTestId('onboarding-terms-checkbox').click()
    await page.getByTestId('onboarding-import-wallet').click()
    await page.getByTestId('metametrics-no-thanks').click()

    await page.waitForURL('**/import-with-recovery-phrase')
    for (const [index, seedPart] of mnemonic.split(' ').entries()) {
      await page.getByTestId(`import-srp__srp-word-${index}`).fill(seedPart)
    }
    await page.getByTestId('import-srp-confirm').click()

    await page.waitForURL('**/create-password')
    await page.getByTestId('create-password-new').fill(password)
    await page.getByTestId('create-password-confirm').fill(password)
    await page.getByTestId('create-password-terms').click()
    await page.getByTestId('create-password-import').click()

    await page.waitForURL('**/completion')
    await page.getByTestId('onboarding-complete-done').click()

    await page.waitForURL('**/pin-extension')
    await page.getByTestId('pin-extension-next').click()
    await page.getByTestId('pin-extension-done').click()
    return this
  }

  teardown() {
    // todo
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
    try {
      const page = await this.waitForDialog('**/{snaps-connect,snap-update}')
      await snapApprove(page)
    } catch {
      // ignore
    }

    const result = await install

    if (isMetamaskRpcError(result))
      throw new EthereumRpcError(result.code, result.message, result.data)

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
