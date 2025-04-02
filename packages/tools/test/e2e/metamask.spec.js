import { createFixture } from '../../src/fixture.js'

const { test, expect } = createFixture()

test.describe('metamask latest stable', () => {
  test('should run setup', async ({ metamask }) => {
    await metamask.setup()

    await expect(metamask.page.getByText('Account 1')).toBeVisible()
  })

  test('should throw on installSnap', async ({ metamask, page }) => {
    await metamask.setup()

    await expect(() => {
      return metamask.installSnap({
        id: 'foo',
        page,
      })
    }).rejects.toThrow(
      'Expected caveat to have a value property of a non-empty object of snap IDs.: At path: value.foo -- Invalid or no prefix found. Expected Snap ID to start with one of: "npm:", "local:", but received: "foo".'
    )
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
