import delay from 'delay'
import Emittery from 'emittery'
import { EthereumRpcError } from 'eth-rpc-errors'
import pRetry from 'p-retry'
import pWaitFor from 'p-wait-for'

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
  // snaps connect
  await page.getByTestId('snap-privacy-warning-scroll').click()
  await page.getByRole('button', { name: 'Accept', exact: true }).click()
  await page.getByTestId('page-container-footer-next').click()
  // snap install
  await page.getByTestId('page-container-footer-next').click()
  const warning = page.getByRole('dialog')

  if (await warning.isVisible()) {
    const checks = await warning.getByRole('checkbox').all()
    for (const check of checks) {
      await check.click()
    }
    await warning.getByTestId('snap-install-warning-modal-confirm').click()
  }
  await page.getByTestId('page-container-footer-next').click()
}

/**
 * Wait for a metamask notification
 * @param {import('@playwright/test').Page} page - Metamask page to wait for notification
 * @param {string} name
 */
async function waitForDialog(page, name) {
  async function run() {
    let done = false
    page.on('request', (request) => {
      if (request.url().includes('_locales/en/messages.json')) {
        done = true
      }
    })

    await page.reload()
    await pWaitFor(() => done)
    await delay(500)
    if (!page.url().includes(name)) {
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
   * @param {boolean} [isFlask]
   */
  constructor(extensions, context, isFlask = false) {
    super()

    this.isFlask = isFlask
    this.context = context
    this.extension = extensions.find((ext) => ext.title === 'MetaMask')
    if (!this.extension) {
      throw new Error('MetaMask extension not found')
    }
    this.page = this.extension.page
    this.extraExtensions = extensions.filter((ext) => ext.title !== 'MetaMask')
    this.#snap = undefined

    // this.page.on('console', redirectConsole)
    // this.page.on('pageerror', (err) => {
    //   console.log('[ERROR]', err.message)
    // })

    // this.context.on('weberror', (webError) => {
    //   console.log(`Uncaught exception: "${webError.error()}"`)
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

    this.on(Metamask.listenerAdded, async ({ eventName }) => {
      if (eventName) {
        try {
          const page = await waitForDialog(this.page, eventName?.toString())
          // @ts-ignore
          this.emit(eventName, page)
        } catch (error) {
          // console.log(
          //   '🚀 ~ file: metamask.js:131 ~ Metamask ~ this.on ~ error:',
          //   error
          // )

          this.emit('error', /** @type {Error} */ (error))
        }
      }
    })
  }

  /**
   * Wait for a dialog
   *
   * @param {(page: import('@playwright/test').Page) => Promise<void>} fn - Function to run after confirmation
   */
  waitForDialog(fn) {
    const page = this.page
    async function run() {
      await page.reload()
      if (fn) {
        await fn(page)
      }
    }

    return pRetry(run, { retries: 3 })
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
    if (this.isFlask) {
      await page
        .getByTestId('experimental-area')
        .getByRole('button', { name: 'I accept the risks', exact: true })
        .click()
      await delay(300)
    }
    // import wallet
    await page.getByTestId('onboarding-terms-checkbox').click()
    await page.getByTestId('onboarding-import-wallet').click()
    await page.getByTestId('metametrics-no-thanks').click()
    await delay(300)
    for (const [index, seedPart] of mnemonic.split(' ').entries()) {
      await page.getByTestId(`import-srp__srp-word-${index}`).fill(seedPart)
    }
    await page.getByTestId('import-srp-confirm').click()
    await page.getByTestId('create-password-new').fill(password)
    await page.getByTestId('create-password-confirm').fill(password)
    await page.getByTestId('create-password-terms').click()
    await page.getByTestId('create-password-import').click()
    await delay(1000)
    await page.getByTestId('onboarding-complete-done').click()
    await delay(300)
    await page.getByTestId('pin-extension-next').click()
    await delay(300)
    await page.getByTestId('pin-extension-done').click()
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
    try {
      await waitForDialog(this.page, 'snaps-connect')
      await snapApprove(this.page)
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

    await delay(1000)

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
