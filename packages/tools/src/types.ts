import type { MetaMaskInpageProvider } from '@metamask/providers'
import type { TruncatedSnap } from '@metamask/snaps-utils'
import type {
  Page,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
  TestType,
} from '@playwright/test'
import type { Metamask } from './metamask.js'

export interface DownloadMetamaskOptions {
  repo?: `${string}/${string}`
  tag?: string
  userAgent?: string
  token?: string
  dir?: string
  asset?: string
  flask?: boolean
  browser?: 'chrome' | 'firefox'
}

export type TextExtend = TestType<
  PlaywrightTestArgs & {
    metamask: Metamask
  },
  PlaywrightWorkerArgs
>['extend']

export interface FixtureOptions {
  download?: Partial<DownloadMetamaskOptions>
  mode?: 'parallel' | 'serial'
  isolated?: boolean
  snap?: Pick<InstallSnapOptions, 'snapId' | 'version'>
  seed?: string
  password?: string
}

export type InstallSnapsResult = Record<string, TruncatedSnap>
declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider
  }
}
export interface InstallSnapOptions {
  /**
   * Page to run request on. Defaults: to the test page
   */
  page: Page
  /**
   * Snap ID
   *
   * @example
   * 'npm:@metamask/example-snap'
   */
  snapId: string
  /**
   * Snap version. Defaults to npm latest published version.
   */
  version?: string
}

interface SnapRequest {
  method: string
  params?: unknown[] | Record<string, unknown>
  id?: string | number
  jsonrpc?: '2.0'
}
export interface InvokeSnapOptions {
  /**
   * Page to run request on. Defaults: to the test page
   */
  page: Page
  request: SnapRequest
}

export interface Codec {
  /**
   * Encode bytes or utf8 string to string
   *
   * @param data - Data to be encoded to string
   * @param pad - Should have padding. Defaults: true
   */
  encode: (data: Uint8Array, pad?: boolean) => string
  decode: (data: string) => Uint8Array
}
