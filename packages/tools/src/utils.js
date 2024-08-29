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
 */
export async function redirectConsole(msg) {
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
    consoleFn.apply(console, msgArgs)
  } else if (text) {
    console.log(`🌐 ${text}`)
  }
}
