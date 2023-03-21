import { test, expect } from 'filsnap-testing-tools'
const SNAP_ID = 'npm:@chainsafe/filsnap'

test.describe('filsnap api with default seed', () => {
  test.beforeEach(async ({ metamask }) => {
    await metamask.onboard()
    await metamask.installSnap({ snapId: SNAP_ID })
  })
  test('should get address mainnet', async ({ metamask }) => {
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getAddress',
      },
    })

    expect(result).toBe('f1jbnosztqwadgh4smvsnojdvwjgqxsmtzy5n5imi')
  })

  test('should get address testnet', async ({ metamask }) => {
    await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getAddress',
      },
    })

    expect(result).toBe('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
  })

  test('should get public key', async ({ metamask }) => {
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getPublicKey',
      },
    })

    expect(result).toBe(
      '04ce1e0e407bed99153d98e909e53bb2186fd322b998c3c5feda46ede66d02d1468e30c2fd54309158991dc0b8d7bbbed8d6816bc54aab2a39496cfc7826a4e537'
    )
  })

  test('should get private key', async ({ metamask }) => {
    metamask.on('notification', (frame) => {
      frame.getByRole('button').filter({ hasText: 'Approve' }).click()
    })
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_exportPrivateKey',
      },
    })

    expect(result).toBe('IwTEHN6u6qxR76Lf8nkIm/JKLl9lRUAL0ulE80wOl/M=')
  })

  test('should get messages', async ({ metamask }) => {
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getMessages',
      },
    })

    expect(result).toStrictEqual([])
  })

  test('should get configure for testnet', async ({ metamask }) => {
    /** @type {import('@chainsafe/filsnap-types').SnapConfig} */
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })

    expect(result).toStrictEqual({
      derivationPath: "m/44'/1'/0'/0/0",
      network: 't',
      rpc: { token: '', url: 'https://api.calibration.node.glif.io' },
      unit: {
        decimals: 6,
        image: 'https://cryptologos.cc/logos/filecoin-fil-logo.svg?v=007',
        symbol: 'FIL',
      },
    })
  })

  test('should get balance', async ({ metamask }) => {
    await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })

    /** @type {import('@chainsafe/filsnap-types').MessageGasEstimate} */
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getBalance',
      },
    })

    expect(result).toBe('100')
  })

  test.fixme('should get gasEstimate', async ({ metamask }) => {
    await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })

    /** @type {import('@chainsafe/filsnap-types').MessageRequest} */
    const message = {
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      value: '0.0011',
    }

    /** @type {import('@chainsafe/filsnap-types').MessageGasEstimate} */
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_getGasForMessage',
        params: { message },
      },
    })

    expect(result).toBe(0)
  })

  // eslint-disable-next-line no-only-tests/no-only-tests
  test.only('should sign raw message', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })

    metamask.on('notification', async (page) => {
      await expect(page.getByText('raw message', { exact: true })).toBeVisible()
      await page.getByRole('button').filter({ hasText: 'Approve' }).click()
    })

    /** @type {import('@chainsafe/filsnap-types').SignRawMessageResponse} */
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_signMessageRaw',
        params: { message: 'raw message' },
      },
    })

    expect(result).toStrictEqual({
      confirmed: true,
      // eslint-disable-next-line unicorn/no-null
      error: null,
      signature:
        'qwM8IkldjEZqTSy8dRiuxHkieagJCjRrVOJPHzPdrrYMxRvhJcjZUslGjslVSz8aOQEmdh8BznPGBUlz9dPPBgE=',
    })
  })

  test.fixme('should sign message', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
    })

    metamask.on('notification', async (page) => {
      // await expect(page.getByText('raw message', { exact: true })).toBeVisible()
      // await page.getByRole('button').filter({ hasText: 'Approve' }).click()
    })

    /** @type {import('@chainsafe/filsnap-types').MessageRequest} */
    const message = {
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      value: '0.001',
    }
    await page.pause()
    /** @type {import('@chainsafe/filsnap-types').SignMessageResponse} */
    const result = await metamask.invokeSnap({
      snapId: SNAP_ID,
      request: {
        method: 'fil_signMessage',
        params: { message },
      },
    })

    expect(result).toStrictEqual({
      confirmed: true,
      // eslint-disable-next-line unicorn/no-null
      error: null,
      signature:
        'qwM8IkldjEZqTSy8dRiuxHkieagJCjRrVOJPHzPdrrYMxRvhJcjZUslGjslVSz8aOQEmdh8BznPGBUlz9dPPBgE=',
    })
  })
})
