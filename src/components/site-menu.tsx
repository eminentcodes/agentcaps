"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import styles from "./site.module.css";

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return <div ref={menu} className={styles.mobileMenu}><button ref={button} className={styles.menuButton} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="website-mobile-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={23} /> : <List size={23} />}</button>{open && <nav id="website-mobile-navigation" className={styles.mobileNavigation} aria-label="Mobile navigation"><Link href="/#controls" onClick={() => setOpen(false)}>Limits</Link><Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link><Link href="/#payments" onClick={() => setOpen(false)}>Payments</Link><Link href="/#questions" onClick={() => setOpen(false)}>FAQs</Link><Link href="/guide" onClick={() => setOpen(false)}>Guide</Link></nav>}</div>;
}
