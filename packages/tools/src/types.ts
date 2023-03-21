import { MetaMaskInpageProvider } from '@metamask/providers'
import { TruncatedSnap } from '@metamask/snaps-utils'
import { Page } from '@playwright/test'

export interface Options {
  repo: `${string}/${string}`
  tag?: string
  userAgent?: string
  token?: string
  dir?: string
  asset?: string
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
  page?: Page
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
  page?: Page
  snapId: string
  request: SnapRequest
}
