# AgentCaps: three-day project plan

Give a crypto agent a budget for one job, control where it can spend, and stop its access.

## Current delivery status — November 8, 2026

The contract, owner-signed payment API, wallet controls, Budgets/Payments/Settings routes, setup guide, and Strix-inspired landing page are implemented. Fifteen contract and authorization tests passed. The landing page uses the inspected local Strix project's light structure and exact Manrope font; all pages remain light as requested.

The app now uses real Base Sepolia wallet data and explicit owner-authorized payments. The earlier seeded local demo, research report, unsigned owner actions, and scenario selector are no longer product features. Local EVM scripts remain contract-development fixtures.

The user has registered for Vibeathon 02. Public deployment and the complete wallet demo remain pending Base Sepolia test ETH for the deployer and agent. Submission also needs the public app URL. The confirmed build deadline is November 9 at 23:00 Lagos; see `docs/submission.md` for current release gates and prepared entry copy.

The schedule below records the original sprint plan. Where it describes the earlier demo or dark theme, the current delivery status above and the README describe the implemented product.

## Delivery target

Ship a working hackathon MVP in three full working days. Prioritize the complete payment flow, clear controls, and a polished demo over feature count.

The demo uses **Base Sepolia and test USDC**. Mainnet deployment is outside this sprint. Official hackathon rules and submission requirements are recorded in `docs/hackathon.md`.

**Success:** an agent makes an allowed payment, an overspend is rejected by the contract, and the owner revokes access and recovers unused funds.

## Four core features

| Feature | What we ship | Proof it works |
| --- | --- | --- |
| Create and fund a task budget | Connect an owner wallet; enter a task name, agent address, USDC budget, approved recipients, and expiry. Approve USDC and deposit the exact budget. | A funded task appears with the correct rules and balance. |
| Controlled agent spending | One agent integration can pay approved recipients within the remaining budget and before expiry. | An allowed transfer succeeds; overspend, unapproved recipients, and expired access are rejected by the contract. |
| Spending receipts | Show successful payments with task, recipient, amount, transaction hash, and confirmation time. Show blocked attempts with a readable reason. | A confirmed receipt links to the block explorer; balances match onchain state. |
| Revoke and recover | The owner revokes the task and withdraws its unused USDC. Withdrawal is also available after expiry. | Later payments fail and the remaining funds return to the owner. |

One assigned agent per task. One supported network and token. Recipient rules and the budget are fixed at creation; changing them means creating a new task. A simple list can show the owner's tasks, without team or fleet management.

## Intentionally deferred

Exception approval requests, budget top-ups, recipient editing, recurring budgets, team accounts, subscriptions, analytics dashboards, swaps, bridging, multiple chains, and integrations with several agent frameworks.

Generic x402/MPP payment support is also deferred. A vault transfer does not automatically satisfy those protocols. The first demo uses a controlled data provider and labels its data as demo data.

## Product flow and UI

**Design read:** a compact spending dashboard for agent owners, with a clear, trust-focused visual language guided by the supplied Strix UI sample.

Use one main workspace: task list, selected task details, and its payment activity. Creating a task uses a dialog; receipts expand in a detail panel. Keep the budget, amount spent, amount remaining, recipients, expiry, and revoke control easy to find.

Primary actions: **Create budget**, **Run agent**, **Revoke access**, and **Withdraw remaining**. Include a clearly labeled demo scenario selector for allowed payment, overspend, and unapproved recipient attempts.

Required states: disconnected wallet, wrong network, no tasks, approval pending, deposit pending, active task, payment pending, payment confirmed, blocked attempt, expired task, revoked task, exhausted budget, withdrawal pending, and RPC failure. Transaction success appears only after confirmation.

### Strix reference and frontend skill

- The **Strix UI reference** was found and inspected at `C:/Users/Great/Desktop/bitget hack`. Use its current light Next.js landing page and exact Manrope font.
- Inspect its layout, typography, spacing, colors, and component treatment before implementing the visual design. If it provides usable source components, check their license and compatibility first.
- Use the installed `design-taste-frontend` skill as requested: `C:/Users/Great/.agents/skills/design-taste-frontend/SKILL.md`.
- The skill explicitly excludes dashboards from its main scope. For this product, use its relevant typography, accessibility, responsive layout, and interaction guidance; use maintained Radix-based components for controls and the Strix sample for visual direction.
- Initial design settings: `DESIGN_VARIANCE: 4`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 5`. Favor readable financial information and useful feedback. Revisit visual details after inspecting the sample.
- Keep typography, accent color, spacing, and corner radii consistent. Use self-hosted fonts and one icon family. Make labels, errors, focus indicators, and button text readable.
- Support narrow screens and keyboard navigation. Preserve the requested light theme even when the operating system or a saved preference requests dark mode.
- Apply the frontend skill's relevant pre-flight checks before shipping. Marketing-only rules do not dictate the dashboard layout.

### Motion animation requirement

Use **Motion** from the user's reference: https://github.com/motiondivision/motion.

- Install the `motion` package and import React APIs from `motion/react`.
- Use short dialog/panel transitions, task selection transitions, and confirmed payment/activity entry feedback.
- Animate balance changes only when confirmed state changes; keep the final amount immediately readable.
- Use animation to explain feedback and state changes. Avoid persistent decorative movement around financial controls.
- Honor `prefers-reduced-motion` through `useReducedMotion`; keep essential status messages visible without animation.
- Animate transforms and opacity where possible. Isolate interactive and animated components behind Next.js client boundaries.

## Implementation approach

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Web app | Next.js, React, TypeScript | Workspace, task creation, receipts, and server-side agent invocation. |
| UI | Tailwind CSS v4, customized shadcn/ui with Radix-based primitives, Phosphor icons | Accessible components styled to the Strix reference. |
| Animation | Motion (`motion/react`) | Purposeful transitions and payment feedback. |
| Wallet and chain access | wagmi and viem; injected wallet connector | Owner transactions, Base Sepolia reads, and agent transactions. |
| Contract | Solidity, OpenZeppelin, Hardhat | Task balances, recipient rules, expiry, authorized spending, and recovery. |
| Agent | Small Node.js/TypeScript research runner | One fixed research workflow and one payment tool calling the vault. |
| Storage | Onchain task state and events | Confirmed balances and successful receipts; no database required for the MVP. |
| Delivery | Hosted web app, published source, deployment record | Judge-accessible demo and reproducible setup. |

The contract holds USDC with a separate balance for each task. Every payment checks the assigned agent, task status, expiry, recipient, positive amount, remaining balance, and a unique payment ID. Successful execution updates accounting and transfers USDC atomically. No task can spend another task's allocation.

Use integer amounts with USDC's six decimals, safe token transfers, checks before external calls, and reentrancy protection. Only the owner can revoke or recover a task's funds. Withdrawing closes out its remaining allocation and cannot be repeated.

Revocation stops spending **once the revoke transaction is confirmed**. A payment confirmed before revocation can still succeed. Expiry is enforced using the contract's timestamp, including rejection at the expiry boundary.

Keep the owner wallet outside the server. The server-side agent signer is a separate test wallet funded with ETH for gas; its key never reaches the browser or repository. The USDC task cap covers transfers, while transaction gas is paid separately.

The agent integration buys a demo token-data report from an approved provider and returns a short result. It uses the same payment tool for allowed and adversarial scenarios. Start with a deterministic runner so the payment demo is repeatable; live LLM reasoning is optional after the core works and must be described accurately in the demo.

Authenticate agent-run requests with an owner wallet signature, a nonce, and a short validity window. Bind authorization to the task and scenario, serialize transactions from the agent signer, and use unique payment IDs to prevent repeated payment execution.

Successful receipts are reconstructed from contract events after refresh. Blocked simulations have no successful payment event; show them as local attempt activity. Persist that activity in browser storage with its local-only limitation stated. If a rejection is submitted onchain, its reverted transaction can also be linked.

## Three-day schedule

Assume approximately eight focused working hours per day. Use delivery gates to keep the sprint honest.

| Day | Work | End-of-day gate |
| --- | --- | --- |
| **Day 1: enforce the rules** | Check hackathon requirements and inspect the Strix sample. Scaffold the app and contract project. Implement funding, payment checks, receipts, revocation, and withdrawal. Run contract tests. Obtain test USDC and gas, deploy to Base Sepolia, and establish UI tokens. | A script creates a funded task, makes an allowed transfer, proves overspend rejection, and recovers funds on the deployed contract. |
| **Day 2: connect the product** | Build the Strix-guided workspace, create-budget dialog, wallet/network states, task details, and receipt activity. Integrate the agent runner. Wire revoke and withdrawal. Add Motion transitions and meaningful errors. | The full owner-to-agent-to-receipt flow works from the app with confirmed testnet transactions. |
| **Day 3: make it demo-ready** | Freeze features. Fix end-to-end failures, review access controls, test mobile and keyboard use, verify themes and reduced motion, and run build/type checks. Deploy the web app. Prepare the README, screenshots, short pitch, and demo recording. | A judge can open the app, follow the documented demo, and verify contract behavior using explorer links. |

Reserve the final two hours for submission and deployment problems. If time slips, cut optional LLM reasoning, extra visual flourishes, and filtering first. Keep budget enforcement, receipts, expiry, revocation, and fund recovery.

## Demo script

1. Connect the owner wallet on Base Sepolia.
2. Create a task with **10 test USDC**, one agent, an approved provider, and a future expiry.
3. Run the agent's allowed **2 USDC** purchase. Show the provider receiving the payment, a confirmed receipt, and **8 USDC remaining**.
4. Run a **9 USDC** attempt. Show the contract rejection and unchanged **8 USDC** balance.
5. Attempt a payment to an unapproved recipient. Show rejection and unchanged balances.
6. Revoke access, wait for confirmation, and attempt another **1 USDC** payment. Show rejection.
7. Withdraw the remaining **8 USDC** and show the owner receiving it.

Use a separate short-lived task to demonstrate expiry if recording time permits. Expiry remains a required automated contract test.

Pitch: **"AgentCaps gives each agent job a spending cap. The contract enforces the budget, recipients, and expiry; the owner sees receipts and can revoke access."**

## Required verification and completion checklist

- [ ] Allowed payments reach the correct recipient and produce accurate receipts.
- [ ] Overspend, cumulative overspend, unapproved recipient, wrong signer, zero amount, expired task, and revoked task are rejected.
- [ ] Exact remaining-balance spending succeeds; spending after exhaustion fails.
- [ ] Duplicate payment IDs fail without transferring funds twice.
- [ ] Failed token transfers leave accounting unchanged; tasks cannot spend each other's funds.
- [ ] Only the owner can revoke/withdraw; unused funds are recoverable after revocation or expiry; repeated withdrawal fails.
- [ ] Funding rejects invalid agent/recipient addresses, zero budgets, and expiry in the past.
- [ ] Hosted agent invocation rejects invalid, expired, mismatched, and replayed authorization.
- [ ] One complete browser flow works on Base Sepolia, including wallet rejection, RPC errors, refresh, revoke, and withdrawal.
- [ ] Build and type checks pass; mobile, keyboard, theme, and reduced-motion checks pass.
- [ ] Deployment addresses and explorer links are recorded; contract source is published and verified where supported.
- [ ] README documents setup, testnet funding, environment variable names, the demo, and limitations without exposing secrets.
- [ ] Hosted demo, source repository, screenshots, recording, and required hackathon submission fields are ready.

## Inputs to resolve early

The exact Strix UI reference; official hackathon rules and deadline; an owner wallet with Base Sepolia test USDC and gas; a separate agent test wallet with gas; and the hosting target. These affect implementation and submission, but do not prevent creating this plan.

**Current status:** application and contract implementation are complete; production build, TypeScript, and 43 UI/API browser checks pass. Public testnet funding, deployment, a complete wallet demo, hosting, and submission remain pending. See `docs/submission.md` for the current release gates.
