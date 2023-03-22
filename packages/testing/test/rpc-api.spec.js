import { createFixture } from 'filsnap-testing-tools'

const SNAP_ID = 'npm:@chainsafe/filsnap'
const { test, expect } = createFixture({
  download: {
    flask: true,
  },
  snap: {
    snapId: SNAP_ID,
  },
})

test.describe('filsnap api with default seed', () => {
  test('should get address mainnet', async ({ metamask, page }) => {
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getAddress',
      },
      page,
    })

    expect(result).toBe('f1jbnosztqwadgh4smvsnojdvwjgqxsmtzy5n5imi')
  })

  test('should get address testnet', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getAddress',
      },
      page,
    })

    expect(result).toBe('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
  })

  test('should get public key', async ({ metamask, page }) => {
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getPublicKey',
      },
      page,
    })

    expect(result).toBe(
      '04ce1e0e407bed99153d98e909e53bb2186fd322b998c3c5feda46ede66d02d1468e30c2fd54309158991dc0b8d7bbbed8d6816bc54aab2a39496cfc7826a4e537'
    )
  })

  test('should get private key', async ({ metamask, page }) => {
    metamask.on('notification', (page) => {
      page.getByRole('button').filter({ hasText: 'Approve' }).click()
    })
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_exportPrivateKey',
      },
      page,
    })

    expect(result).toBe('IwTEHN6u6qxR76Lf8nkIm/JKLl9lRUAL0ulE80wOl/M=')
  })

  test('should get messages', async ({ metamask, page }) => {
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getMessages',
      },
      page,
    })

    expect(result).toStrictEqual([])
  })

  test('should get configure for testnet', async ({ metamask, page }) => {
    /** @type {import('@chainsafe/filsnap-types').SnapConfig} */
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
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

  test('should get balance', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })

    /** @type {import('@chainsafe/filsnap-types').MessageGasEstimate} */
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getBalance',
      },
      page,
    })

    expect(result).toBe('100')
  })

  test.fixme('should get gasEstimate', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })

    /** @type {import('@chainsafe/filsnap-types').MessageRequest} */
    const message = {
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      value: '0.0011',
    }

    /** @type {import('@chainsafe/filsnap-types').MessageGasEstimate} */
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_getGasForMessage',
        params: { message },
      },
      page,
    })

    expect(result).toBe(0)
  })

  // eslint-disable-next-line no-only-tests/no-only-tests
  test('should sign raw message', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })

    metamask.on('notification', async (page) => {
      await expect(page.getByText('raw message', { exact: true })).toBeVisible()
      await page.getByRole('button').filter({ hasText: 'Approve' }).click()
    })

    /** @type {import('@chainsafe/filsnap-types').SignRawMessageResponse} */
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_signMessageRaw',
        params: { message: 'raw message' },
      },
      page,
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
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })

    metamask.on('notification', async () => {
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
      request: {
        method: 'fil_signMessage',
        params: { message },
      },
      page,
    })

    expect(result).toStrictEqual({
      confirmed: true,
      // eslint-disable-next-line unicorn/no-null
      error: null,
      signature:
        'qwM8IkldjEZqTSy8dRiuxHkieagJCjRrVOJPHzPdrrYMxRvhJcjZUslGjslVSz8aOQEmdh8BznPGBUlz9dPPBgE=',
    })
  })

  test.fixme('should send message', async ({ metamask, page }) => {
    await metamask.invokeSnap({
      request: {
        method: 'fil_configure',
        params: {
          configuration: { network: 't' },
        },
      },
      page,
    })

    metamask.on('notification', async () => {
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
    // @ts-ignore
    // eslint-disable-next-line no-unused-vars
    const result = await metamask.invokeSnap({
      request: {
        method: 'fil_signMessage',
        params: { message },
      },
      page,
    })

    // TODO fil_sendMessage
  })
})
