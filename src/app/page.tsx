import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Coins, Cpu, Plus, Receipt, ShieldCheck, ShieldSlash, Stack, Wallet } from "@phosphor-icons/react/dist/ssr";
import { SiteFooter, SiteHeader } from "@/components/site";
import { LandingControls, LandingProcess, Reveal } from "@/components/landing-interactions";
import styles from "./landing.module.css";

const questions = [
  ["Which wallet and network do I need?", "Use an injected wallet such as MetaMask or Coinbase Wallet on Base Sepolia. You approve budget deposits, revoke access, and withdraw funds from that wallet."],
  ["Does the spending cap include gas?", "The cap applies to USDC payments. Your wallet and the agent wallet use Base Sepolia ETH to pay transaction gas separately."],
  ["Can the agent pay any address?", "Only the recipient addresses approved when the budget was created. The vault rejects payments to every other address."],
  ["Can I change a funded budget?", "The cap and recipient list are fixed. Revoke access, recover unused funds, and create a new budget when the task needs different rules."],
  ["When does revocation stop payments?", "Once its transaction confirms. A payment confirmed before revocation can still succeed; later payments are rejected."],
  ["Where do payment records come from?", "Confirmed payments, withdrawals, and revocations come from contract events on Base Sepolia. A blocked simulation is stored separately in your browser and transfers no USDC."],
];

export default function Home() {
  return <div className={styles.page}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <main id="main-content">
      <section className={styles.heroShell} aria-labelledby="hero-heading">
        <SiteHeader variant="hero" />
        <div className={styles.hero}>
          <div className={`${styles.heroCopy} hero-copy`}>
            <p className={styles.eyebrow}>USDC budgets for AI agents</p>
            <h1 id="hero-heading"><span>Cap every task.</span><span>Track every payment.</span></h1>
            <p className={styles.heroDescription}>Set USDC budgets, approve recipients, and follow every agent payment from your wallet.</p>
            <div className={styles.heroActions}><Link className={styles.primaryButton} href="/app">Manage budgets <ArrowUpRight size={19} /></Link><Link className={styles.inlineLink} href="#how-it-works">How it works <ArrowRight size={18} /></Link></div>
          </div>
          <div className={styles.heroNodes} aria-label="Wallet, budget, and payment">
            <div className={`${styles.heroOrbit} ${styles.heroOrbitOuter}`} aria-hidden="true" /><div className={`${styles.heroOrbit} ${styles.heroOrbitInner}`} aria-hidden="true" />
            <Link className={`${styles.heroNode} ${styles.heroWallet}`} href="/guide"><span className={styles.nodeMedallion}><Wallet size={47} weight="duotone" /></span><span>Wallet <ArrowUpRight size={12} /></span></Link>
            <Link className={`${styles.heroNode} ${styles.heroBudget}`} href="#controls"><span className={styles.nodeMedallion}><Stack size={58} weight="duotone" /></span><span>Budget <ArrowUpRight size={12} /></span></Link>
            <Link className={`${styles.heroNode} ${styles.heroPayment}`} href="#payments"><span className={styles.nodeMedallion}><Receipt size={47} weight="duotone" /></span><span>Payment <ArrowUpRight size={12} /></span></Link>
          </div>
        </div>
      </section>
      <div className={`${styles.container} ${styles.contextBar}`}><span>Task budgets, funded from your wallet.</span><div><span>Base Sepolia</span><span>Test USDC</span></div></div>

      <section id="controls" className={`${styles.container} ${styles.section}`} aria-labelledby="controls-heading">
        <Reveal className={styles.sectionHeading}><h2 id="controls-heading">A cap. A recipient list.<br /><span>An expiry.</span></h2><p>Set the payment rules once. They apply to every transfer from the task.</p></Reveal>
        <LandingControls />
      </section>

      <section className={`${styles.container} ${styles.principles}`} aria-labelledby="ownership-heading">
        <Reveal><h2 id="ownership-heading">The agent can pay.<br /><span>The budget is yours.</span></h2><p className={styles.largeCopy}>Fund a job without handing over your wallet.</p><p className={styles.bodyCopy}>One assigned agent spends from one task allocation. You approve the recipients and decide when access ends.</p></Reveal>
        <Reveal className={styles.principleList}>{[
          { icon: Coins, title: "Separate funds for each task", body: "One task cannot use another task’s balance." },
          { icon: Cpu, title: "One assigned agent", body: "Only the agent wallet you choose can submit payments." },
          { icon: Receipt, title: "Confirmed transaction records", body: "Check the amount, recipient, and hash on Basescan." },
        ].map(({ icon: Icon, title, body }) => <div className={styles.principle} key={title}><Icon size={25} weight="duotone" /><div><h3>{title}</h3><p>{body}</p></div></div>)}</Reveal>
      </section>

      <section id="how-it-works" className={`${styles.container} ${styles.section}`} aria-labelledby="process-heading"><Reveal className={styles.sectionHeading}><h2 id="process-heading">From a funded task<br /><span>to a confirmed payment.</span></h2><p>Create the rules, fund the budget, and authorize the payment.</p></Reveal><LandingProcess /></section>

      <section id="payments" className={`${styles.container} ${styles.paymentSection}`} aria-labelledby="payments-heading">
        <Reveal className={styles.productPreview}><div className={styles.previewHeading}><Stack size={18} weight="fill" /><span>AgentCaps · Budgets</span><span>Base Sepolia</span></div><Link href="/app" aria-label="View your budgets"><Image src="/images/workspace.png" width={1212} height={820} alt="AgentCaps budgets page before a wallet is connected, with budget controls and payment activity." sizes="(max-width: 767px) calc(100vw - 64px), 55vw" /></Link><p>Connect your wallet to load your budgets and payment history.</p></Reveal>
        <Reveal className={styles.paymentCopy}><h2 id="payments-heading">Check the payment.<br /><span>Open the transaction.</span></h2><p>Each confirmed transfer has a receipt you can verify on Base Sepolia.</p><ol className={styles.receiptDetails}><li><span>01</span><div><h3>Recipient</h3><p>The address that received the USDC.</p></div></li><li><span>02</span><div><h3>Amount</h3><p>The amount sent, in USDC.</p></div></li><li><span>03</span><div><h3>Transaction hash</h3><p>A direct link to the confirmed transaction on Basescan.</p></div></li></ol><Link className={styles.inlineLink} href="/app/receipts">View payments <ArrowUpRight size={18} /></Link></Reveal>
      </section>

      <section className={`${styles.container} ${styles.section}`} aria-labelledby="recovery-heading"><Reveal className={styles.sectionHeading}><h2 id="recovery-heading">Stop access.<br /><span>Recover the balance.</span></h2><p>Unused USDC returns to the wallet that funded the task.</p></Reveal><div className={styles.recoveryGrid}><Reveal className={styles.recoveryPrimary}><ShieldSlash size={46} weight="duotone" /><h3>Revoke spending<br />when the task is done.</h3><p>After revocation confirms, the agent can no longer make payments from the budget. Withdraw its remaining USDC.</p><Link href="/guide#recovery" className={styles.inlineLink}>Read about recovery <ArrowUpRight size={18} /></Link><Stack size={155} weight="duotone" className={styles.recoveryMark} aria-hidden="true" /></Reveal><div className={styles.recoverySecondary}><Reveal className={styles.recoveryCard}><Clock size={27} weight="duotone" /><h3>Access expires automatically.</h3><p>The vault rejects payments at or after the expiry you set. Remaining funds are then available to withdraw.</p></Reveal><Reveal className={styles.recoveryCard}><ShieldCheck size={27} weight="duotone" /><h3>Recovery belongs to the owner.</h3><p>Only the task’s owner wallet can revoke access or withdraw its unused allocation.</p></Reveal></div></div></section>

      <section id="questions" className={`${styles.container} ${styles.faq}`} aria-labelledby="faq-heading"><Reveal><h2 id="faq-heading">Before you fund<br /><span>a budget.</span></h2><p>Wallets, fees, and the rules behind each payment.</p><Link className={styles.inlineLink} href="/guide">Read the setup guide <ArrowUpRight size={17} /></Link></Reveal><div className={styles.questions}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={19} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>

      <section className={`${styles.container} ${styles.closing}`} aria-labelledby="closing-heading"><Reveal><h2 id="closing-heading">Set the rules.<br />Fund your first task.</h2><Link className={styles.primaryButton} href="/app">Manage budgets <ArrowUpRight size={19} /></Link></Reveal><Stack className={styles.closingMark} size={180} weight="duotone" aria-hidden="true" /></section>
    </main>
    <SiteFooter />
  </div>;
}
