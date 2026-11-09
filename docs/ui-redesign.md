# AgentCaps design and page structure

## Inspected reference

The current light Strix project is at `C:/Users/Great/Desktop/bitget hack`. Its Next.js landing components, global styles, root layout, and desktop captures were inspected. The older dark standalone HTML is not the requested reference.

AgentCaps follows its rounded mint hero with integrated navigation, centered headline, three raised icon tiles, vertical feature tabs, varied feature sections, horizontal process tabs, FAQs, and mint closing panel. The exact Manrope font and its license are copied into `public/fonts/` and loaded with `next/font/local`. Geist Mono remains for addresses and financial values.

The AgentCaps stacked mark, forest-green accent, wallet controls, and confirmed chain data are preserved. The app and website remain light, including when the operating system or old saved preference requests dark mode.

## Product labels and pages

| URL | Purpose |
| --- | --- |
| `/` | Public landing page: “Cap every task. Track every payment.” |
| `/guide` | Wallet setup, budget funding, payments, receipts, and fund recovery. |
| `/app` | Budgets: create, fund, select, pay, revoke, and recover. |
| `/app/receipts` | Payments: confirmed transfers and locally recorded blocked simulations. |
| `/app/settings` | Settings: wallet balances, network, contract, and agent details. |

Visible navigation uses Budgets, Payments, Settings, and Account. Copy describes amounts, recipient addresses, transactions, and wallet actions directly.

The app has a shared layout and wallet/query providers. Marketing pages do not initialize those providers or request wallet data. The landing product image is captured from the actual disconnected Budgets page; no balances, task history, or customer claims are fabricated.

## Interaction and verification

The budget-control and lifecycle tabs support arrow keys, Home, End, appropriate tab roles, and focus management. Mobile navigation, FAQ disclosure, and section links work without leaving important content hidden before animation. Motion transitions respect reduced motion.

`scripts/review-pages.mjs` verifies all five pages at 320, 390, 768, 1024, and 1440 pixels, including navigation, font loading, copy, API errors, and hydration. Run it against the current server and consult `verification/page-review.json` for the latest result. Contract tests separately verify money rules; a funded, deployed Base Sepolia wallet flow remains a release gate.
