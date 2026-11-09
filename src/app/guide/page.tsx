import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function Guide() {
  return <><SiteHeader /><main className="guide"><Link href="/" className="guide-back"><ArrowLeft size={17} />Home</Link><h1>AgentCaps setup guide.</h1><p>Connect a Base Sepolia wallet, fund a task with test USDC, and authorize payments.</p>
    <section id="wallet"><h2>Connect a wallet</h2><p>Open Budgets and connect an injected wallet such as MetaMask or Coinbase Wallet. Switch to Base Sepolia. Settings shows that wallet’s test USDC and ETH balances.</p><p>The connected wallet owns the budgets it creates. Deposits, revocations, and withdrawals are signed in that wallet.</p></section>
    <section id="budgets"><h2>Create and fund a budget</h2><p>Enter a task name, USDC cap, agent wallet, approved recipients, and expiry. Approve the exact USDC amount, then confirm its deposit into the vault.</p><p>The task appears after the deposit confirms. Its funds are separate from every other task. The cap and recipient list are fixed at creation.</p></section>
    <section id="payments"><h2>Authorize a payment</h2><p>For a task assigned to the app’s configured agent, select an approved recipient and enter an amount. Your wallet signs the exact task, amount, recipient, and a short expiry. The agent submits the transaction.</p><p>The contract checks the agent, recipient, available budget, expiry, and payment ID. A different assigned agent can submit payments directly to the vault within the same rules.</p></section>
    <section id="receipts"><h2>View payment records</h2><p>Payments shows confirmed transfers, withdrawals, and revocations from contract events. Open a receipt to inspect the amount, recipient, confirmation time, and transaction hash.</p><p>The Basescan link opens the confirmed transaction. A rejected simulation transfers no USDC and is stored separately in the current browser.</p></section>
    <section id="recovery"><h2>Revoke access and recover USDC</h2><p>Revoke a task and wait for confirmation. Later payments are rejected. A payment that confirms before revocation can still succeed.</p><p>Withdraw unused USDC after revocation or expiry. Only the owner can recover it, and the funds return to that owner wallet.</p></section>
    <section id="network"><h2>Get Base Sepolia test funds</h2><p>Test USDC funds task budgets. Base Sepolia ETH pays gas for the owner and agent wallets. These are separate balances.</p><p>Settings lists the vault, official USDC token, and configured agent. Funding is unavailable until the vault has been deployed.</p><a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="button button-secondary">Get test USDC <ArrowUpRight size={17} /></a></section>
    <Link href="/app" className="button button-primary">Manage budgets <ArrowUpRight size={18} /></Link>
  </main><SiteFooter /></>;
}
