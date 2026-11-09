"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Slot } from "@radix-ui/react-slot";
import { X, CircleNotch } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
// Owned, customized shadcn-style controls built on Radix primitives.
export function Button({ children, className, variant = "primary", busy, asChild = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; busy?: boolean; asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={clsx("button", `button-${variant}`, className)} {...props} disabled={busy || props.disabled}>{busy && <CircleNotch className="spinner" size={16} aria-hidden="true" />}{children}</Component>;
}
export function Modal({ open, onOpenChange, title, description, children, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className={clsx("modal-content", className)}><motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }}><div className="modal-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close dialog"><X size={20} /></Dialog.Close></div>{children}</motion.div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function RevokeDialog({ open, onOpenChange, name, onConfirm, busy }: { open: boolean; onOpenChange: (open: boolean) => void; name: string; onConfirm: () => void; busy: boolean }) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal><AlertDialog.Overlay className="modal-overlay" /><AlertDialog.Content className="modal-content small"><AlertDialog.Title>Revoke spending access?</AlertDialog.Title><AlertDialog.Description className="revoke-description">Once confirmed, the agent cannot spend from “{name}”. You can then withdraw its remaining USDC.</AlertDialog.Description><div className="modal-actions"><AlertDialog.Cancel asChild><Button variant="secondary" disabled={busy}>Keep access</Button></AlertDialog.Cancel><Button variant="danger" busy={busy} onClick={onConfirm}>Revoke access</Button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>;
}
