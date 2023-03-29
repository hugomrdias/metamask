import { createFixture } from '../../src/fixture.js'

let fixture = createFixture({
  download: {
    flask: true,
  },
})
fixture.test(
  'should install a latest version of flask',
  async ({ page, metamask }) => {
    fixture.expect(metamask.version).toContain('flask')
    fixture.expect(metamask.isFlask).toBe(true)
  }
)

fixture = createFixture()
fixture.test(
  'should install a latest metamask version',
  async ({ page, metamask }) => {
    fixture.expect(metamask.version).not.toContain('flask')
    fixture.expect(metamask.isFlask).toBe(false)
  }
)

fixture = createFixture({
  download: {
    tag: 'v10.26.2',
  },
})
fixture.test(
  'should install a specific metamask version',
  async ({ page, metamask }) => {
    fixture.expect(metamask.version).toBe('10.26.2')
    fixture.expect(metamask.isFlask).toBe(false)
  }
)

fixture = createFixture({
  download: {
    tag: 'v10.26.2',
    flask: true,
  },
})
fixture.test(
  'should install a specific metamask flask version',
  async ({ page, metamask }) => {
    fixture.expect(metamask.version).toBe('10.26.2-flask.0')
    fixture.expect(metamask.isFlask).toBe(true)
  }
)
