# metamask-testing-tools

This is a collection of tools for testing metamask, metamask flask and metamask snaps with [Playwright](https://playwright.dev/).

> Note: Currently metamask >= v10.28.0 is not supported.

## Install

```bash
pnpm add metamask-testing-tools -D
```

## Usage

This package is meant to be used with [Playwright](https://playwright.dev/). It provides a `createFixture` function that returns a `test` and `expect` function that can be used to write tests.

More information on writing tests with Playwright can be found [here](https://playwright.dev/docs/test-intro).

```js
// tests.spec.js

import { createFixture } from 'metamask-testing-tools'

const { test, expect } = createFixture({
  download: {
    flask: true,
  },
  snap: {
    snapId: 'npm:@chainsafe/filsnap',
  },
})

test('should get address mainnet', async ({ metamask, page }) => {
  const result = await metamask.invokeSnap({
    request: {
      method: 'fil_getAddress',
    },
    page,
  })

  expect(result).toBe('f1jbnosztqwadgh4smvsnojdvwjgqxsmtzy5n5imi')
})
```

## Docs

Check <https://hugomrdias.github.io/filsnap-testing/modules/metamask_testing_tools.html>

## ENV variables

These variables can be used to override the default values.

- `GITHUB_TOKEN` - GitHub API token to download metamask from github releases.
- `METAMASK_TAG` - Tag of metamask to download. Defaults to `latest`.
- `METAMASK_SEED` - Seed to use for metamask.
- `METAMASK_PASSWORD` - Password to use for metamask.
- `METAMASK_SNAP_ID` - Snap ID to use for metamask.
- `METAMASK_SNAP_VERSION` - Snap version to use for metamask.
