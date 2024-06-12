import { createFixture } from '../../src/fixture.js'

let fixture = createFixture({
  downloadOptions: {
    flask: true,
    tag: 'v11.16.5',
  },
})

fixture.test(
  'should install a latest version of flask',
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
    tag: 'v11.15.3',
  },
})
fixture.test(
  'should install a specific metamask version',
  async ({ metamask, page }) => {
    fixture.expect(await metamask.getVersion(page)).toBe('MetaMask/v11.15.3')
  }
)

fixture = createFixture({
  downloadOptions: {
    tag: 'v11.15.3',
    flask: true,
  },
})
fixture.test(
  'should install a specific metamask flask version',
  async ({ metamask, page }) => {
    fixture
      .expect(await metamask.getVersion(page))
      .toBe('MetaMask/v11.15.3-flask.0')
  }
)
