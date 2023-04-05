# filsnap-testing

> Note: Currently metamask >= v10.28.0 is not supported.

## Usage

```bash

pnpm run test
pnpm run test -- --headed # run tests in headful mode
pnpm run test -- --debug # run tests in debug mode
```

## Github Actions

The CI needs to be configured with the following secrets:

- `WEB3_TOKEN` - web3.storage token
- `SLACK_WEBHOOK` - slack webhook url

## Wallets

Target: t1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi
Tests: t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna

### Faucet

https://faucet.calibration.fildev.network/

## Notes

wallets needs funds to gas estimate
