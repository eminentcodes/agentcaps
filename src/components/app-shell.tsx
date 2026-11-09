"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BookOpen, CaretRight, CircleNotch, GearSix, Info, List, Receipt, ShieldCheck, Stack, Wallet, WarningCircle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui";
import { shortAddress, useWorkspace } from "./workspace-provider";
import { WorkspaceDialogs } from "./workspace";

const navigation = [
  { href: "/app", label: "Budgets", icon: Stack },
  { href: "/app/receipts", label: "Payments", icon: Receipt },
  { href: "/app/settings", label: "Settings", icon: GearSix },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = navigation.find(item => item.href === pathname) || navigation[0];
  const { address, chainId, isConnected, connecting, config, configLoading, configError, workspaceError, pending, step, notice, dismissNotice, connectWallet, switchNetwork, refresh, tasks } = useWorkspace();
  const [mobileNav, setMobileNav] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  function closeNavigation() { setMobileNav(false); menuButton.current?.focus(); }

  useEffect(() => {
    if (!mobileNav) return;
    sidebar.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileNav(false); menuButton.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileNav]);

  return <div className="app-shell">
    <a href="#workspace" className="skip-link">Skip to main content</a>
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={closeNavigation} />}
    <aside id="workspace-navigation" ref={sidebar} className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="sidebar-brand-row"><Link href="/" className="brand" aria-label="AgentCaps home"><span className="brand-mark"><Stack weight="fill" size={25} /></span><span>agent<span className="brand-caps">caps</span><span className="brand-period">.</span></span></Link><button className="icon-button mobile-nav-close" onClick={closeNavigation} aria-label="Close navigation"><X size={20} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">AC</span><div><strong>Your account</strong><span>{address ? shortAddress(address) : "Connect your wallet"}</span></div></div>
      <div className="nav-label">ACCOUNT</div>
      <nav aria-label="Main navigation">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileNav(false)} className={`nav-item ${pathname === href ? "selected" : ""}`} aria-current={pathname === href ? "page" : undefined}><Icon size={20} weight={pathname === href ? "fill" : "regular"} />{label}{href === "/app" && <span className="nav-count">{isConnected && config?.configured ? tasks.length : ""}</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><ShieldCheck size={24} weight="duotone" /><strong>Budget limits</strong><p>Each payment must fit the cap, recipients, and expiry.</p><Link href="/guide">Read the setup guide <ArrowUpRight size={14} /></Link></div><Link href="/guide" className="nav-item"><BookOpen size={20} />Setup guide</Link><div className="sidebar-footer"><span>Base Sepolia</span><span>Testnet</span></div></div>
    </aside>
    <div className="main-shell" inert={mobileNav || undefined}>
      <header className="topbar"><div className="breadcrumb"><button ref={menuButton} className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation" aria-expanded={mobileNav} aria-controls="workspace-navigation"><List size={23} /></button><Link href="/app">AgentCaps</Link><CaretRight size={12} /><strong>{current.label}</strong></div><div className="topbar-actions"><span className="network-chip"><span className="base-mark" aria-hidden="true" />Base Sepolia</span>{isConnected && address ? <Link href="/app/settings" className="button button-secondary wallet-button"><Wallet size={18} />{shortAddress(address)}</Link> : <Button variant="secondary" className="wallet-button" onClick={connectWallet} busy={connecting}><Wallet size={18} />{connecting ? "Connecting" : "Connect wallet"}</Button>}</div></header>
      <main id="workspace" className="workspace-main">
        {configLoading && <div className="environment-banner" data-config-loading="true" role="status"><CircleNotch size={17} className="spinner" /><span>Loading account configuration…</span></div>}
        {!configLoading && !config?.configured && !configError && <div className="environment-banner"><Info size={18} /><span><strong>Budget funding unavailable.</strong> The Base Sepolia vault has not been deployed. Connect your wallet to view its balance in Settings.</span><Link href="/app/settings">Settings <ArrowUpRight size={14} /></Link></div>}
        {isConnected && chainId !== 84532 && <div className="environment-banner warning"><WarningCircle size={18} /><span>Your wallet is on a different network.</span><Button variant="secondary" onClick={switchNetwork}>Switch to Base Sepolia</Button></div>}
        {(configError || workspaceError) && <div className="inline-error" role="alert"><span>{(configError || workspaceError)?.message}</span><button onClick={refresh}>Retry connection</button></div>}
        {children}
        <footer className="main-footer"><span><ShieldCheck size={16} />Base Sepolia · Test USDC</span><Link href="/guide">Setup guide <ArrowUpRight size={14} /></Link></footer>
      </main>
    </div>
    <AnimatePresence>{notice && <motion.div className={`notice notice-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span>{notice.tone === "error" ? <WarningCircle size={22} /> : <ShieldCheck size={22} />}</span><p>{notice.text}</p><button className="icon-button" aria-label="Dismiss notification" onClick={dismissNotice}><X size={18} /></button></motion.div>}</AnimatePresence>
    {pending && <div className="pending-bar" role="status"><CircleNotch size={18} className="spinner" />{step}</div>}
    <WorkspaceDialogs />
  </div>;
}
