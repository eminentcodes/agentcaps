"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Clock, Coins, Cpu, ListChecks, ShieldCheck, ShieldSlash, Stack, Wallet } from "@phosphor-icons/react";
import styles from "@/app/landing.module.css";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={reduced ? undefined : { y: [12, 0] }} viewport={{ once: true, amount: .15 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }}>{children}</motion.div>;
}

function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, current: number, count: number, prefix: string, select: (index: number) => void) {
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : count - 1)) % count;
  select(next);
  document.getElementById(`${prefix}-${next}`)?.focus();
}

const controls = [
  { name: "Spending caps", icon: Coins, label: "USDC", title: "A separate budget for each task.", body: "Each task gets its own allocation. A payment cannot exceed the remaining balance or borrow from another task.", checks: ["An exact USDC cap", "Funds isolated by task"], link: "/guide#budgets", action: "Read about budgets" },
  { name: "Approved recipients", icon: ListChecks, label: "Recipients", title: "Choose who the agent can pay.", body: "Add recipient addresses when you create the budget. The vault rejects transfers to any other address.", checks: ["Up to 10 recipient addresses", "Recipients fixed at creation"], link: "/guide#payments", action: "Read about payments" },
  { name: "Expiry & revocation", icon: Clock, label: "Access", title: "Decide when spending stops.", body: "Set an expiry for the task or revoke access sooner. Recover unused USDC after expiry or confirmed revocation.", checks: ["Expiry checked on every payment", "Unused funds return to the owner"], link: "/guide#recovery", action: "Read about recovery" },
];

export function LandingControls() {
  const [active, setActive] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const reduced = useReducedMotion();
  function select(index: number) { setHasInteracted(true); setActive(index); }
  const selected = controls[active];
  const Icon = selected.icon;
  return <div className={styles.controlExplorer}>
    <div className={styles.controlSelector}>
      <div className={styles.controlTabs} role="tablist" aria-label="Budget controls" aria-orientation="vertical">
        {controls.map(({ name, icon: Glyph }, index) => <button key={name} id={`control-tab-${index}`} role="tab" aria-selected={index === active} aria-controls="control-panel" tabIndex={index === active ? 0 : -1} onClick={() => select(index)} onKeyDown={event => navigateTabs(event, index, controls.length, "control-tab", select)}>
          <span className={styles.controlTabIcon}><Glyph size={23} weight="duotone" /></span><span>{name}</span><ArrowRight size={18} className={styles.tabArrow} />
        </button>)}
      </div>
      <Link href="/app" className={styles.inlineLink}>Manage budgets <ArrowUpRight size={17} /></Link>
    </div>
    <div id="control-panel" role="tabpanel" aria-labelledby={`control-tab-${active}`} tabIndex={0} className={`${styles.controlPanel} ${active ? styles[`controlPanel${active}`] : ""}`}>
      <motion.div key={active} className={styles.controlPanelContent} initial={hasInteracted && !reduced ? { opacity: .7, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}>
        <div className={styles.controlPanelTop}><span>Checked before every transfer</span><ShieldCheck size={19} /></div>
        <Icon size={190} weight="duotone" className={styles.controlWatermark} aria-hidden="true" />
        <span className={styles.controlLabel}>{selected.label}</span><h3>{selected.title}</h3><p>{selected.body}</p>
        <ul className={styles.controlChecks}>{selected.checks.map(check => <li key={check}><Check size={17} weight="bold" />{check}</li>)}</ul>
        <Link href={selected.link} className={styles.inlineLink}>{selected.action}<ArrowUpRight size={16} /></Link>
      </motion.div>
    </div>
  </div>;
}

const stages = [
  { name: "Create", icon: Stack, title: "Give the task its own budget.", body: "Name the task, choose an agent wallet, enter the USDC cap, and add the recipients it can pay.", detail: "Your wallet owns the task and its unused funds.", nodes: ["Owner wallet", "Task rules", "Agent wallet"] },
  { name: "Fund", icon: Wallet, title: "Approve the amount. Deposit it.", body: "Approve the exact USDC budget in your wallet, then confirm its deposit. Funding appears after the transaction confirms.", detail: "ETH pays gas separately from the USDC budget.", nodes: ["Owner wallet", "USDC approval", "Budget vault"] },
  { name: "Pay", icon: Cpu, title: "Send a payment within the rules.", body: "For the app’s configured agent, choose a recipient and amount. Your wallet signs that exact request; the agent submits the payment.", detail: "Confirmed transfers include a transaction receipt.", nodes: ["Agent wallet", "Budget checks", "Recipient"] },
  { name: "Recover", icon: ShieldSlash, title: "Return the unused USDC.", body: "After expiry or confirmed revocation, withdraw the remaining funds. The vault transfers them back to the owner wallet.", detail: "Confirmed revocation prevents further agent payments.", nodes: ["Spending stopped", "Unused USDC", "Owner wallet"] },
];

export function LandingProcess() {
  const [active, setActive] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const reduced = useReducedMotion();
  function select(index: number) { setHasInteracted(true); setActive(index); }
  const stage = stages[active];
  const Icon = stage.icon;
  return <div className={styles.process}>
    <div className={styles.processTabs} role="tablist" aria-label="Budget lifecycle">
      {stages.map(({ name }, index) => <button key={name} role="tab" id={`process-tab-${index}`} aria-selected={index === active} aria-controls="process-panel" tabIndex={index === active ? 0 : -1} onClick={() => select(index)} onKeyDown={event => navigateTabs(event, index, stages.length, "process-tab", select)}><span>0{index + 1}</span>{name}</button>)}
    </div>
    <div id="process-panel" role="tabpanel" aria-labelledby={`process-tab-${active}`} tabIndex={0} className={styles.processPanel}>
      <div className={styles.processVisual} aria-label={stage.nodes.join(" to ")}>
        <div className={styles.processRing} aria-hidden="true" /><span className={styles.processCenter}><Icon size={62} weight="duotone" /></span>
        {stage.nodes.map((node, index) => <span key={node} className={`${styles.processNode} ${styles[`processNode${index}`]}`}>{node}</span>)}
      </div>
      <motion.div key={active} className={styles.processCopy} initial={hasInteracted && !reduced ? { opacity: .7, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}><h3>{stage.title}</h3><p>{stage.body}</p><div className={styles.processDetail}><Check size={18} />{stage.detail}</div></motion.div>
    </div>
  </div>;
}
