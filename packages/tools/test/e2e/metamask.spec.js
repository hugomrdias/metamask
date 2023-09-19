import { createFixture } from '../../src/fixture.js'

const { test, expect } = createFixture()

test.describe('metamask latest stable', () => {
  test('should not be flask', async ({ page, metamask }) => {
    expect(metamask.isFlask).toBe(false)
  })

  test('should run setup', async ({ metamask }) => {
    expect(metamask.isFlask).toBe(false)
    await metamask.setup()

    await expect(metamask.walletPage.getByText('Account 1')).toBeVisible()
  })

  test('should throw on installSnap', async ({ page, metamask }) => {
    await metamask.setup()

    await expect(() => {
      return metamask.installSnap({
        id: 'foo',
        url: 'http://example.org',
      })
    }).rejects.toThrow('Invalid snap ID: Expected the value to satisfy a union')
  })

  test('should throw on getSnaps', async ({ page, metamask }) => {
    await metamask.setup()

    expect(() => {
      return metamask.getSnaps(page)
    }).toThrow(
      'There\'s no snap installed yet. Run "metamask.installSnap()" first.'
    )
  })

  test('should throw on invokeSnap', async ({ page, metamask }) => {
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
