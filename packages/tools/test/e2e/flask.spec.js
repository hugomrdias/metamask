import { createFixture } from '../../src/fixture.js'

const { test, expect } = createFixture({
  download: {
    flask: true,
  },
})

test.describe('metamask flask latest stable', () => {
  test('should be flask', async ({ metamask }) => {
    expect(metamask.isFlask).toBe(true)
  })

  test('should run setup', async ({ metamask }) => {
    expect(metamask.isFlask).toBe(true)
    await metamask.setup()

    await expect(metamask.walletPage.getByText('Account 1')).toBeVisible()
  })

  test('should throw on getSnaps before installing snap', async ({
    page,
    metamask,
  }) => {
    await metamask.setup()

    expect(() => {
      return metamask.getSnaps(page)
    }).toThrow(
      'There\'s no snap installed yet. Run "metamask.installSnap()" first.'
    )
  })

  test('should throw on invokeSnap before installing snap', async ({
    page,
    metamask,
  }) => {
    await metamask.setup()

    expect(() => {
      return metamask.invokeSnap({
        page,
        request: {
          method: 'foo',
        },
      })
    }).toThrow(
      'There\'s no snap installed yet. Run "metamask.installSnap()" first.'
    )
  })
})
