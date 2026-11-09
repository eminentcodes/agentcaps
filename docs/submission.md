# AgentCaps submission preparation

Updated November 8, 2026. The user confirms they have already registered for Vibeathon 02.

Deployment target remains **Base Sepolia**. After discussing Arc as a USDC-gas alternative, the user reaffirmed the Base target. No Arc migration or public deployment has been performed.

**Build deadline: November 9, 2026, 22:00 UTC / 23:00 Lagos.** The [official rules](https://blog.vibestarter.xyz/vibeathon-02) require a usable working MVP and a live URL. Entries remain editable until that deadline.

## Entry copy

**Name:** AgentCaps

**One-line description:** Give every agent task a USDC spending cap, approved recipients, and an expiry.

**Project description:** AgentCaps lets you fund a separate budget for each crypto-agent task. A Base Sepolia vault checks the assigned agent, remaining balance, approved recipient, expiry, and unique payment ID before transferring test USDC. Owners can inspect confirmed transaction receipts, revoke spending access, and withdraw unused funds. The web app includes Budgets, Payments, and Settings, with wallet-signed funding and owner-authorized agent payments.

**AI-assisted build:** AI tools helped scope the MVP, implement and test the vault, build the Next.js wallet flows, and refine the landing page against the local Strix reference. The implementation record is in `docs/build-log.md`; contract and browser verification are recorded separately.

## Release gates

| Item | Current state |
| --- | --- |
| Registration | Confirmed by the user on November 8. |
| Landing and app code | Implemented, including Strix structure and local Manrope. |
| Contract and authorization checks | 15 tests passed during the build. |
| Production build and types | Passed on November 8 after the final font, animation, and mobile style fixes. |
| Browser review | 43 UI/API checks passed; `verification/page-review.json` records the result. Desktop and mobile hero captures were refreshed after the final style fix. |
| Deployer and agent gas | Latest check: both have 0 Base Sepolia test ETH. |
| Public testnet vault | Pending; `deployments/testnet.json` is not present. |
| Full owner wallet demo | Pending funding and public testnet deployment. |
| Public app URL | Pending hosting. `127.0.0.1` is a local preview only. |
| Submission | Not submitted from this project. |

A short recording, screenshots, source repository, and explorer links will help reviewers assess the build. The saved official rules explicitly require a working MVP and live URL; they do not establish that every supporting artifact is mandatory.

## Wallet funding

| Role | Base Sepolia address | Asset |
| --- | --- | --- |
| Deployer | `0x938Bd4dB8139D6F1C45a7729F74A7DEC6Ff9E556` | Test ETH for contract deployment. |
| Agent | `0x3F02715cF48f7D2380b421CD30915B55D7e23d95` | Test ETH for payment gas. |
| Owner | The wallet connected to the app. | Test ETH for gas and test USDC for deposits. |

Use Base Sepolia, chain 84532. Around 0.002 test ETH per signer is a practical starting balance. [Circle's faucet](https://faucet.circle.com/) supplies test USDC; use [Base's ETH faucet list](https://docs.base.org/base-chain/tools/network-faucets) for gas.

The [Coinbase Developer Platform faucet](https://portal.cdp.coinbase.com/products/faucet) supports Base Sepolia ETH after a free account sign-in. QuickNode and Alchemy require existing mainnet funds or activity; Chainstack requires an API key and a mainnet balance. ETH Faucet uses BringID verification. Automated claim attempts on November 8 did not establish funding; several claim pages failed to load fully in the browser environment. Confirm actual balances with `npm run status:testnet`.

Alternatives checked on November 8:

- **Ethereum Sepolia faucet, then bridge:** the [Sepolia PoW faucet](https://sepolia-faucet.pk910.de/) exchanges browser computation for test ETH, with a 0.05 ETH minimum claim. Its public configuration requires CAPTCHA before starting and includes Human Passport checks for restricted IPs. No claim was completed. [Base's bridge documentation](https://docs.base.org/base-chain/network-information/ecosystem-bridges) confirms a [Superbridge testnet route](https://superbridge.app/?fromChainId=11155111&toChainId=84532) from Ethereum Sepolia to Base Sepolia; retain some Sepolia ETH for bridge gas.
- **Receive test ETH:** a transfer of Base Sepolia test ETH from another developer or the hackathon community can fund the existing addresses without changing the build. No transfer has been arranged or received.
- **USDC-only network:** [Arc Testnet](https://docs.arc.io/arc/references/connect-to-arc) uses USDC for gas and lists Circle's faucet as its token source. This requires selecting Arc Testnet in the faucet. AgentCaps is currently fixed to Base Sepolia; moving it would require network, USDC address, fee display, deployment, and explorer changes plus verification. Arc native USDC uses 18 decimals, while its ERC-20 interface uses 6 decimals and shares the same balance. Migration has not been requested or implemented.
- **Circle Developer Console:** the public faucet's FAQ says the console can supply native test tokens to addresses created with Circle Wallets. The [native-token API](https://developers.circle.com/api-reference/wallets/programmable-wallets/request-testnet-tokens) supports `BASE-SEPOLIA`, but explicitly requires upgrading the Circle developer account to mainnet. No Circle API key or entity secret is configured in this project's environment, so this is not an immediate automated funding route. A later HTTP check successfully read Circle's public faucet and confirmed Arc Testnet is listed; no token claim was submitted.

The Google Cloud faucet sign-in shell loaded, but its claim form did not finish loading. The Optimism console and Circle faucet also did not load reliably in automated checks; these page visits are not evidence of received funds. The latest balance check still showed zero test ETH in both Base Sepolia signer wallets.

## Two-minute demo outline

1. Show the landing page and open Budgets.
2. Connect the owner wallet on Base Sepolia. Create and fund a 10 test USDC budget with the configured agent and an approved recipient.
3. Authorize a 2 USDC payment, wait for confirmation, and show 8 USDC remaining.
4. Open Payments and verify the receipt on Basescan.
5. Revoke the task, wait for confirmation, and recover the unused 8 USDC.
6. Refresh and show the confirmed payment, revocation, and withdrawal history.

Describe overspend, expiry, unknown-recipient, and replay enforcement using the automated contract evidence. The UI currently offers owner-authorized payments; avoid presenting it as autonomous AI research or an x402/MPP client.

## After funding

1. Run `npm run status:testnet`, then `npm run deploy:testnet` and `node scripts/configure-testnet.mjs`.
2. Restart the app. Confirm `/api/config` identifies the deployed Base Sepolia vault and configured agent.
3. Execute and record the complete wallet demo. Save the actual explorer links.
4. Configure a full Next.js host using the README environment instructions. Recheck the public URL and signed payment route on that host.
5. Put the live URL and accurate project description into the user's existing Vibeathon entry before the deadline.
