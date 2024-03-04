import { createFixture } from '../../src/fixture.js'

const password = '12345678'
const rainbowExtensionId = 'opfgelmcmbiajamepnmloijbpoleiama'

const { test, expect } = createFixture({
  download: {
    flask: true,
    extensions: [
      {
        id: rainbowExtensionId,
        title: 'Rainbow Wallet',
        findPage: async (ctx, installedExtensionId) => {
          let page = ctx
            .pages()
            .find((p) =>
              p
                .url()
                .startsWith(
                  `chrome-extension://${installedExtensionId}/popup.html`
                )
            )

          if (!page) {
            page = await ctx.waitForEvent('page', {
              predicate: (page) => {
                return page
                  .url()
                  .startsWith(
                    `chrome-extension://${installedExtensionId}/popup.html`
                  )
              },
            })
          }
          await page.waitForLoadState('domcontentloaded')
          return page
        },
      },
    ],
  },
})

/**
 * @param {{ [s: string]: any; } | ArrayLike<any>} data
 */
async function setupExtraExtensions(data) {
  for (const [key, value] of Object.entries(data)) {
    if (key === rainbowExtensionId) {
      const page = value.page
      await page.getByTestId('create-wallet-button').click()
      await page.getByTestId('skip-button').click()
      await page.getByTestId('password-input').fill(password)
      await page.getByTestId('confirm-password-input').fill(password)
      await page.getByTestId('set-password-button').click()
    }
  }
}

test.describe('snaps rainbow', () => {
  test('should install metamask when rainbow is present', async ({
    page,
    metamask,
    extraExtensions,
  }) => {
    await metamask.setup()
    await extraExtensions(setupExtraExtensions)

    const snapId = 'npm:@metamask/test-snap-dialog'
    const result = await metamask.installSnap({
      id: snapId,
      url: 'http://example.org',
    })

    await expect(page.getByText('Example Domain')).toBeVisible()
    expect(result[snapId].id).toBe(snapId)
  })
})
