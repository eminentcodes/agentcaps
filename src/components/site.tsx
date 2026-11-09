import Link from "next/link";
import { ArrowUpRight, Stack } from "@phosphor-icons/react/dist/ssr";
import { SiteMenu } from "./site-menu";
import styles from "./site.module.css";

export function SiteHeader({ variant = "standard" }: { variant?: "standard" | "hero" }) {
  return <header className={`${styles.header} ${variant === "hero" ? styles.heroHeader : ""}`}><div className={styles.headerInner}><Link href="/" className={styles.brand} aria-label="AgentCaps home"><Stack size={28} weight="fill" /><span>agentcaps<span className={styles.period}>.</span></span></Link><nav className={styles.navigation} aria-label="Website navigation"><Link href="/#controls">Limits</Link><Link href="/#how-it-works">How it works</Link><Link href="/#payments">Payments</Link><Link href="/#questions">FAQs</Link><Link href="/guide">Guide</Link></nav><div className={styles.headerActions}><Link className={styles.openApp} href="/app">Manage budgets <ArrowUpRight size={17} /></Link><SiteMenu /></div></div></header>;
}

export function SiteFooter() {
  return <footer className={styles.footer}><div className={styles.footerInner}><div><Link href="/" className={styles.brand} aria-label="AgentCaps home"><Stack size={25} weight="fill" /><span>agentcaps<span className={styles.period}>.</span></span></Link><p>USDC budgets for AI agents.</p></div><nav aria-label="Footer navigation"><Link href="/app">Budgets</Link><Link href="/app/receipts">Payments</Link><Link href="/guide">Setup guide</Link></nav><p className={styles.footerNote}>Base Sepolia · Test USDC<br />© {new Date().getFullYear()} AgentCaps</p></div></footer>;
}
