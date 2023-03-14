export interface Currency {
  id: string
  type: 'crypto' | 'fiat'
  name: string
  code: string
  isSuspended: boolean
  isSupportedInUS: boolean
  supportsTestMode: boolean
}
