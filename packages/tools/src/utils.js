import { EthereumRpcError } from 'eth-rpc-errors'
import { isValidCode } from 'eth-rpc-errors/dist/utils.js'

/**
 *
 * @param {unknown} obj
 * @returns {obj is import('eth-rpc-errors/dist/classes.js').SerializedEthereumRpcError}
 */
export function isMetamaskRpcError(obj) {
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
export function ensurePageLoadedURL(page) {
  if (page.url() === 'about:blank') {
    throw new Error('Go to a page first')
  }

  return page
}

/** @type {Record<string, any>} */
const messageTypeToConsoleFn = {
  log: console.log,
  warning: console.warn,
  error: console.error,
  info: console.info,
  assert: console.assert,
  debug: console.debug,
  trace: console.trace,
  dir: console.dir,
  dirxml: console.dirxml,
  profile: console.profile,
  profileEnd: console.profileEnd,
  startGroup: console.group,
  startGroupCollapsed: console.groupCollapsed,
  endGroup: console.groupEnd,
  table: console.table,
  count: console.count,
  timeEnd: console.log,

  // we ignore calls to console.clear, as we don't want the page to clear our terminal
  // clear: console.clear
}

/**
 * workaround to get hidden description
 * jsonValue() on errors returns {}
 *
 * @param {any} arg
 */
function extractErrorMessage(arg) {
  // pup-firefox doesnt have this
  if (arg._remoteObject) {
    return arg._remoteObject.subtype === 'error'
      ? arg._remoteObject.description
      : undefined
  }
}

/**
 * @param {import('@playwright/test').ConsoleMessage} msg
 * @param {string} prefix
 */
export async function redirectConsole(msg, prefix = 'Metamask') {
  const type = msg.type()

  const consoleFn = messageTypeToConsoleFn[type]

  if (!consoleFn) {
    return
  }
  const text = msg.text()

  let msgArgs

  try {
    msgArgs = await Promise.all(
      msg.args().map((arg) => extractErrorMessage(arg) || arg.jsonValue())
    )
  } catch {
    // ignore error runner was probably force stopped
  }

  if (msgArgs && msgArgs.length > 0) {
    consoleFn.apply(console, [`[${prefix}]`, ...msgArgs])
  } else if (text) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`[${prefix}] ${text}`)
  }
}

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function injectGetProvider(page) {
  await page.evaluate(async () => {
    if ('getProvider' in window) return
    // @ts-ignore
    window.getProvider = async function getProvider(timeout = 1000) {
      let timeoutHandle = 0
      return await new Promise((resolve, reject) => {
        // @ts-ignore
        const onProviderFound = (event) => {
          clearTimeout(timeoutHandle) // Clear the timeout on successful provider detection
          const { rdns } = event.detail.info
          switch (rdns) {
            case 'io.metamask':
            case 'io.metamask.flask':
            case 'io.metamask.mmi': {
              const provider = event.detail.provider
              if (!provider || !provider.isMetaMask) {
                reject(new Error('Provider not supported or not found.'))
              } else {
                window.removeEventListener(
                  'eip6963:announceProvider',
                  onProviderFound
                )
                resolve(provider)
              }
              break
            }
            default: {
              // console.error('Provider not supported or not found.', rdns)
              // reject(new Error('Provider not supported or not found.'))
              break
            }
          }
        }

        window.addEventListener('eip6963:announceProvider', onProviderFound)

        window.dispatchEvent(new CustomEvent('eip6963:requestProvider'))
        // Set a timeout to reject the promise if no provider is found within the specified time
        timeoutHandle = window.setTimeout(() => {
          window.removeEventListener(
            'eip6963:announceProvider',
            onProviderFound
          )
          reject(new Error('Provider request timed out.'))
        }, timeout)
      })
    }
  })
}

/**
 * Get installed snaps
 *
 * @param {import('@playwright/test').Page} page
 */
export async function getSnaps(page) {
  await injectGetProvider(page)
  const result = await page.evaluate(async () => {
    // const getRequestProvider = () => {
    //   return new Promise((resolve) => {
    //     // Define the event handler directly. This assumes the window is already loaded.
    //     // @ts-ignore
    //     const handler = (event) => {
    //       const { rdns } = event.detail.info
    //       switch (rdns) {
    //         case 'io.metamask':
    //         case 'io.metamask.flask':
    //         case 'io.metamask.mmi': {
    //           window.removeEventListener('eip6963:announceProvider', handler)
    //           resolve(event.detail.provider)
    //           break
    //         }
    //         default: {
    //           break
    //         }
    //       }
    //     }

    //     window.addEventListener('eip6963:announceProvider', handler)
    //     window.dispatchEvent(new Event('eip6963:requestProvider'))
    //   })
    // }

    try {
      // @ts-ignore
      const api = await window.getProvider()
      const result = await api.request({
        method: 'wallet_getSnaps',
      })

      return result
    } catch (error) {
      return /** @type {error} */ (error)
    }
  })
  if (isMetamaskRpcError(result))
    throw new EthereumRpcError(result.code, result.message, result.data)

  if (!result) {
    throw new Error(
      `Unknown RPC error: "wallet_requestSnaps" didnt return a response`
    )
  }

  return /** @type {import('./types.js').InstallSnapsResult} */ (result)
}

/**
 * Installs snap
 * @param {import('@playwright/test').Page} page
 * @param {string} snapId
 * @param {string} [snapVersion]
 */
export async function installSnap(page, snapId, snapVersion) {
  await injectGetProvider(page)

  const install = page.evaluate(
    async ({ snapId, version }) => {
      // const getRequestProvider = () => {
      //   return new Promise((resolve) => {
      //     // Define the event handler directly. This assumes the window is already loaded.
      //     // @ts-ignore
      //     const handler = (event) => {
      //       const { rdns } = event.detail.info
      //       switch (rdns) {
      //         case 'io.metamask':
      //         case 'io.metamask.flask':
      //         case 'io.metamask.mmi': {
      //           window.removeEventListener(
      //             'eip6963:announceProvider',
      //             handler
      //           )
      //           resolve(event.detail.provider)
      //           break
      //         }
      //         default: {
      //           break
      //         }
      //       }
      //     }

      //     window.addEventListener('eip6963:announceProvider', handler)
      //     window.dispatchEvent(new Event('eip6963:requestProvider'))
      //   })
      // }

      try {
        // @ts-ignore
        const api = await window.getProvider()
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
      snapId,
      version: snapVersion,
    }
  )

  return /** @type {Promise<import('./types.js').InstallSnapsResult>} */ (
    install
  )
}

/**
 * Call snap
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@metamask/providers').RequestArguments} arg
 */
export async function callSnap(page, arg) {
  await injectGetProvider(page)

  const result = await page.evaluate(async (arg) => {
    // const getRequestProvider = () => {
    //   return new Promise((resolve) => {
    //     // Define the event handler directly. This assumes the window is already loaded.
    //     // @ts-ignore
    //     const handler = (event) => {
    //       const { rdns } = event.detail.info
    //       switch (rdns) {
    //         case 'io.metamask':
    //         case 'io.metamask.flask':
    //         case 'io.metamask.mmi': {
    //           window.removeEventListener('eip6963:announceProvider', handler)
    //           resolve(event.detail.provider)
    //           break
    //         }
    //         default: {
    //           break
    //         }
    //       }
    //     }

    //     window.addEventListener('eip6963:announceProvider', handler)
    //     window.dispatchEvent(new Event('eip6963:requestProvider'))
    //   })
    // }
    try {
      // @ts-ignore
      const api = await globalThis.getProvider()
      // @ts-ignore
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
