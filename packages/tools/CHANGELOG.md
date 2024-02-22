# Changelog

## [1.2.0](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.10...metamask-testing-tools-v1.2.0) (2024-02-22)


### Features

* ability to add extensions to the playwright environment ([#30](https://github.com/hugomrdias/filsnap-testing/issues/30)) ([85e99f3](https://github.com/hugomrdias/filsnap-testing/commit/85e99f3a850ddf1a73b7e1610122b39dc613bf44))


### Bug Fixes

* failing tests in metamask.spec.js ([#27](https://github.com/hugomrdias/filsnap-testing/issues/27)) ([4afcd9e](https://github.com/hugomrdias/filsnap-testing/commit/4afcd9e2f7d4357c3303e230c3310ee0f8edb773))
* tweaked wait for popups retries ([#29](https://github.com/hugomrdias/filsnap-testing/issues/29)) ([5e51815](https://github.com/hugomrdias/filsnap-testing/commit/5e518150c98b5b79d6883bbb10e18e34293c56ee))

## [1.1.10](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.9...metamask-testing-tools-v1.1.10) (2023-09-21)


### Bug Fixes

* go back to 5 retries ([b8c73a4](https://github.com/hugomrdias/filsnap-testing/commit/b8c73a4bd82f58c8d4d23bdb3789a4bef5c23e12))

## [1.1.9](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.8...metamask-testing-tools-v1.1.9) (2023-09-20)


### Bug Fixes

* remove force on click ([f70c3eb](https://github.com/hugomrdias/filsnap-testing/commit/f70c3eb35aaaf750e4828f9fd7334d3cda92f35d))

## [1.1.8](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.7...metamask-testing-tools-v1.1.8) (2023-09-19)


### Bug Fixes

* fix snap approve logic ([14c53f3](https://github.com/hugomrdias/filsnap-testing/commit/14c53f3bd0436fef5e008aa3110c166d55f56f8c))

## [1.1.7](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.6...metamask-testing-tools-v1.1.7) (2023-09-19)


### Bug Fixes

* fake user agent and remove flask checks ([ba0f86c](https://github.com/hugomrdias/filsnap-testing/commit/ba0f86c6c7c0e918f9f05f716e867be912af55e0))

## [1.1.6](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.5...metamask-testing-tools-v1.1.6) (2023-09-07)


### Bug Fixes

* fix waiting for multiple popups in a row ([1a40172](https://github.com/hugomrdias/filsnap-testing/commit/1a40172c630c95a0c280eb02167ecad95b09ebc2))

## [1.1.5](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.4...metamask-testing-tools-v1.1.5) (2023-08-17)


### Bug Fixes

* update metamask snaps ([1b5c52d](https://github.com/hugomrdias/filsnap-testing/commit/1b5c52dca2ba26dfb2df399c93dd6ac5622becf6))

## [1.1.4](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.3...metamask-testing-tools-v1.1.4) (2023-07-17)


### Bug Fixes

* use env vars for snap id ([3a687ca](https://github.com/hugomrdias/filsnap-testing/commit/3a687ca55054111236b5bda5d27aa73e12c0d7e4))

## [1.1.3](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.2...metamask-testing-tools-v1.1.3) (2023-07-17)


### Bug Fixes

* add better error when not loading popup ([56deee1](https://github.com/hugomrdias/filsnap-testing/commit/56deee1797949f3c8665dd92fdfda74443731892))
* move goto to metamask hooks to avoid race ([d07a5b5](https://github.com/hugomrdias/filsnap-testing/commit/d07a5b5576d260d357d41801835436ca8ac3c34a))

## [1.1.2](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.1...metamask-testing-tools-v1.1.2) (2023-07-14)


### Bug Fixes

* improve fixture cleanup ([cefcbad](https://github.com/hugomrdias/filsnap-testing/commit/cefcbadad16f90d4342a0da07aa2c6061478222e))

## [1.1.1](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.1.0...metamask-testing-tools-v1.1.1) (2023-07-12)


### Bug Fixes

* fix docs generation ([e7cb475](https://github.com/hugomrdias/filsnap-testing/commit/e7cb4759c687feebcb1c5bbeee37fc87a057b87e))
* fix snap connect url logic ([bd5fc5f](https://github.com/hugomrdias/filsnap-testing/commit/bd5fc5fc97092632cb7ba2613426ac71e7bb9268))

## [1.1.0](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.0.3...metamask-testing-tools-v1.1.0) (2023-07-12)


### Features

* add waitForDialog and support for more dialog events ([ed7de2b](https://github.com/hugomrdias/filsnap-testing/commit/ed7de2bf524429a1d387e4a3f082eb538ae1114e))
* remove testing and update deps ([9a4a17a](https://github.com/hugomrdias/filsnap-testing/commit/9a4a17a71944a7e773f2576f3b4778334e22a371))

## [1.0.3](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.0.2...metamask-testing-tools-v1.0.3) (2023-07-07)


### Bug Fixes

* fix snap connect step ([d3999dd](https://github.com/hugomrdias/filsnap-testing/commit/d3999dd0f7f10cf5cb5689203ac43bcec51c8cf0))

## [1.0.2](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.0.1...metamask-testing-tools-v1.0.2) (2023-06-20)


### Bug Fixes

* make version optional again ([068f555](https://github.com/hugomrdias/filsnap-testing/commit/068f555db16baa9ab56bfaa25693c084d70fc244))

## [1.0.1](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v1.0.0...metamask-testing-tools-v1.0.1) (2023-06-17)


### Bug Fixes

* add clean up for non isolated mode ([ff63b63](https://github.com/hugomrdias/filsnap-testing/commit/ff63b636cf045830defd7964df7e6567d3e530db))
* force version mm needs it now ([777c5e3](https://github.com/hugomrdias/filsnap-testing/commit/777c5e38b98ae7589a19363ae4d7a8935c756e75))

## [1.0.0](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v0.1.1...metamask-testing-tools-v1.0.0) (2023-06-15)


### ⚠ BREAKING CHANGES

* update deps

### Features

* update deps ([486e9c4](https://github.com/hugomrdias/filsnap-testing/commit/486e9c4c73c8740f9fe9c1e4f4dad959c3ccb9e4))


### Bug Fixes

* improve reliability ([ddda30e](https://github.com/hugomrdias/filsnap-testing/commit/ddda30e9929c2601b44e679bf3c743772b697632))

## [0.1.1](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v0.1.0...metamask-testing-tools-v0.1.1) (2023-04-05)


### Bug Fixes

* fix docs url ([7a5bf28](https://github.com/hugomrdias/filsnap-testing/commit/7a5bf2823a74889bfcdfea54c2fe3b58f82a96db))

## [0.1.0](https://github.com/hugomrdias/filsnap-testing/compare/metamask-testing-tools-v0.0.1...metamask-testing-tools-v0.1.0) (2023-04-05)


### Features

* add createFixture ([3171e08](https://github.com/hugomrdias/filsnap-testing/commit/3171e082fb0421c30f330928ee30cef92c136e78))
* cov for configure and estimate ([#4](https://github.com/hugomrdias/filsnap-testing/issues/4)) ([14bb7a9](https://github.com/hugomrdias/filsnap-testing/commit/14bb7a99b31d036578792b4bf1111a65f6cff11b))
* docs and publish ([7e1df37](https://github.com/hugomrdias/filsnap-testing/commit/7e1df37dd2b013becbee5624efce611a74868dcd))
* download, app and snap install fix ([b759daf](https://github.com/hugomrdias/filsnap-testing/commit/b759dafa204c41811b6055ac3b5c11bc5aa97df0))
* enable tests that failed because of gas limit ([#3](https://github.com/hugomrdias/filsnap-testing/issues/3)) ([ae0b194](https://github.com/hugomrdias/filsnap-testing/commit/ae0b194d1956bc2193756b8a9b527f301cbb18c8))
* extract fixture to tools package ([#2](https://github.com/hugomrdias/filsnap-testing/issues/2)) ([be98a6f](https://github.com/hugomrdias/filsnap-testing/commit/be98a6fc50f0d95e3b7e06c98232dad4d2e8ae08))
* filecoin tools ([d3db2f9](https://github.com/hugomrdias/filsnap-testing/commit/d3db2f9f5afcf51844dca36d714e0b34afc4d94c))
* playwright testing ([b7a2196](https://github.com/hugomrdias/filsnap-testing/commit/b7a2196b4a6f5736ccbaaeed82f0b73bcaaf91aa))
* tools package ([010b6ea](https://github.com/hugomrdias/filsnap-testing/commit/010b6ea4e3a819126cb2de0436ae9b0d24ab87b6))


### Bug Fixes

* allow retries but failfast ([c2fda0e](https://github.com/hugomrdias/filsnap-testing/commit/c2fda0eace75825cf3c3a1770ea8f4dd6efcb4cf))
* better handle env vars ([2fe54ab](https://github.com/hugomrdias/filsnap-testing/commit/2fe54ab596dcc4bd20d333997c8cdee771e034e1))
* documentation ([e043fad](https://github.com/hugomrdias/filsnap-testing/commit/e043fad9ebfd27a5575110fd1cad1ad8832283e6))
* fail fast in CI ([db94f32](https://github.com/hugomrdias/filsnap-testing/commit/db94f3252caffef786f0bc4d6af0dd24ec631159))
* fix workflow ([77c1166](https://github.com/hugomrdias/filsnap-testing/commit/77c116663018cb321ef38b61f8c5105a8d7e44e4))
* readme and reports in all workflows ([cf34f54](https://github.com/hugomrdias/filsnap-testing/commit/cf34f54c64d936fe4723e4aabe70ddd7b30e36cf))
