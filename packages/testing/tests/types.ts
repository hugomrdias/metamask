import { TruncatedSnap } from '@metamask/snaps-utils'
import { Page } from '@playwright/test'

export type InstallSnapsResult = Record<string, TruncatedSnap>

export interface InstallSnapOptions {
  /**
   * Page to run requestSnaps on. Defaults: to the test page
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
