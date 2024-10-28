import { createFixture } from '../../src/fixture.js'

let fixture = createFixture({
  downloadOptions: {
    flask: true,
  },
})

fixture.test(
  'should install a latest metamask flask version',
  async ({ metamask, page }) => {
    fixture.expect(await metamask.getVersion(page)).toContain('flask')
  }
)

fixture = createFixture()
fixture.test(
  'should install a latest metamask version',
  async ({ metamask, page }) => {
    fixture.expect(await metamask.getVersion(page)).not.toContain('flask')
  }
)

fixture = createFixture({
  downloadOptions: {
    tag: 'v12.4.2',
  },
})
fixture.test(
  'should install a specific metamask version',
  async ({ metamask, page }) => {
    fixture.expect(await metamask.getVersion(page)).toBe('MetaMask/v12.4.2')
  }
)

fixture = createFixture({
  downloadOptions: {
    tag: 'v12.4.2',
    flask: true,
  },
})
fixture.test(
  'should install a specific metamask flask version',
  async ({ metamask, page }) => {
    fixture
      .expect(await metamask.getVersion(page))
      .toBe('MetaMask/v12.4.2-flask.0')
  }
)
