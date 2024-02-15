import type { MetaMaskInpageProvider } from '@metamask/providers'
import type { TruncatedSnap } from '@metamask/snaps-utils'
import type { SetOptional } from 'type-fest'

import type {
  Page,
  BrowserContext,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
  TestType,
} from '@playwright/test'
import type { Metamask } from './metamask.js'

interface Extension {
  id: string
  title: string
  findPage: (
    context: BrowserContext,
    extensionId: string
  ) => Promise<Page> | null
}

export interface DownloadMetamaskOptions {
  repo?: `${string}/${string}`
  tag?: string
  userAgent?: string
  token?: string
  dir?: string
  asset?: string
  flask?: boolean
  extensions?: Extension[]
  browser?: 'chrome' | 'firefox'
}

export type TextExtend = TestType<
  PlaywrightTestArgs & {
    metamask: Metamask
  },
  PlaywrightWorkerArgs
>['extend']

export interface FixtureOptions {
  /**
   * Options to download metamask.
   */
  download?: Partial<DownloadMetamaskOptions>
  /**
   * Should the metamask instance be isolated. Defaults: true
   * Each test will have a new metamask instance and new browser context
   */
  isolated?: boolean
  snap?: SetOptional<InstallSnapOptions, 'url'>
  /**
   * Mnemonic to use for metamask instance. Defaults: process.env.MNEMONIC or 'already turtle birth enroll since owner keep patch skirt drift any dinner'
   */
  mnemonic?: string
  /**
   * Password to use for metamask instance. Defaults: process.env.PASSWORD or '12345678'
   */
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
   * URL to install snap from
   */
  url: string | URL
  /**
   * Snap ID
   *
   * @example
   * 'npm:@metamask/example-snap'
   */
  id: string
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
