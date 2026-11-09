# AgentCaps

Set a USDC budget for each agent task, approve its recipients, and choose when spending access ends. The vault checks those rules on every payment. Owners can revoke access and recover unused funds.

**Base Sepolia (84532), test USDC only.** The website runs locally now. Funding and payments require the deployed vault and funded testnet wallets.

## Run the app

Requires Node.js 22 or newer and npm:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. The landing page and guide are public. Budgets, Payments, and Settings are under `/app`. Connect an injected wallet such as MetaMask or Coinbase Wallet on Base Sepolia to use the payment controls.

Without deployment configuration, the app displays its deployment status and allows wallet connection and balance checks. Task balances and confirmed receipts come from Base Sepolia.

## Deploy the Base Sepolia vault

For a fresh checkout, copy `.env.example` to `.env.testnet.local` and set `DEPLOYER_PRIVATE_KEY`, `AGENT_PRIVATE_KEY`, and `DEMO_MERCHANT_ADDRESS`. Existing generated test keys in this checkout should be reused. Private keys stay in ignored environment files.

Fund the deployer and agent with **Base Sepolia test ETH**. Around 0.002 test ETH each is a useful starting amount. The owner wallet connected to the app also needs test ETH for gas and test USDC for budget deposits.

- ETH: [Base's official faucet list](https://docs.base.org/base-chain/tools/network-faucets).
- USDC: [Circle faucet](https://faucet.circle.com/), selecting Base Sepolia.
- Existing public wallet addresses: `deployments/testnet-wallets.json`.

```sh
npm run status:testnet
npm run deploy:testnet
node scripts/configure-testnet.mjs
npm run dev
```

Restart the development server after deployment. The script validates the chain and official six-decimal USDC token, deploys `AgentCapsVault`, and records the vault address, deployment block, transaction hash, and agent address in `deployments/testnet.json`. The configuration script updates `.env.local` for the public testnet app.

Official Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`.

## Demo flow

1. Connect the owner wallet on Base Sepolia and open **Budgets**.
2. Create a task with a 10 test USDC cap, the configured agent address, an approved recipient, and a future expiry. Confirm the exact USDC approval and deposit in the wallet.
3. Select the task and approve a 2 USDC payment. The owner signs the request; the agent submits it. Wait for confirmation and check the 8 USDC remaining.
4. Open **Payments** and inspect the receipt's amount, recipient, and Basescan transaction link.
5. Revoke access and wait for confirmation. Withdraw the remaining 8 USDC to the owner.
6. Refresh to confirm the recovered balance and event history remain accurate.

The contract tests additionally prove overspend, unknown recipients, wrong signers, expired access, revoked access, duplicate payment IDs, and failed token transfers are rejected. The app's payment form restricts selection to approved recipients; it has no synthetic scenario selector.

## Host the app

Use a Node.js-compatible Next.js host. Build with `npm run build`, then run `npm start`. API routes are required for configuration, chain reads, and agent payments, so use a full Next.js deployment.

Set these deployment values in the host environment before building:

```text
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_VAULT_ADDRESS=<deployed vault>
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_AGENT_ADDRESS=<configured agent>
NEXT_PUBLIC_DEPLOYMENT_BLOCK=<deployment block>
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
AGENT_PRIVATE_KEY=<server-only agent key>
```

The deployer key is only needed for contract deployment. Owner approvals, deposits, revocations, and withdrawals are signed in the connected wallet. The agent signer queue coordinates one server process; use a single persistent Node.js instance for the MVP.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The 15 contract and authorization tests use a local Hardhat EVM. Compilation uses the installed solc package. Local chain scripts remain available as contract development fixtures; the web app is fixed to Base Sepolia.

With the app running:

```sh
npm run test:browser
```

The browser review checks all five pages at widths from 320 to 1440 pixels, the local Manrope font, navigation, keyboard-operated landing tabs, FAQs, light mode, public network configuration, and rejection of malformed or unsigned payment requests. It uses installed Microsoft Edge on Windows, or Playwright Chromium on other systems (`npx playwright install chromium`). Results are written to `verification/page-review.json`.

Refresh the actual product image with:

```sh
node scripts/review-pages.mjs --capture-product
```

These UI/API checks and local contract tests do not constitute a complete wallet flow on the public testnet. That flow must be verified after funding and deployment.

## Architecture and limits

- `contracts/AgentCapsVault.sol`: isolated task balances, fixed recipients, expiry, payment IDs, and owner recovery.
- `/api/agent/pay`: validates an owner signature binding the chain, vault, task, recipient, amount, request ID, and an authorization window of at most five minutes. The server signs payments only for its assigned agent.
- Confirmed transfers, revocations, and withdrawals are reconstructed from contract events. Blocked simulations are stored in the current browser. RPC failures and declined wallet requests have separate error states.
- Revocation stops spending once its transaction confirms. Gas is paid in ETH separately from the USDC cap.
- One assigned agent per task. Changing a budget or its recipients requires recovering funds and creating another task.
- The MVP supplies a payment tool for agent integrations. Live AI research, x402/MPP, recurring budgets, teams, and multiple networks remain outside its scope.
- The landing page follows the inspected light Strix project at `C:/Users/Great/Desktop/bitget hack`, including its locally hosted Manrope font. The app and website use a light palette.

See `docs/hackathon.md` for the official deadline, `docs/submission.md` for submission preparation, and `docs/build-log.md` for the implementation record.
