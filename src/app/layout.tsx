import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/geist-mono";
import "./globals.css";
const manrope = localFont({ src: "../../public/fonts/manrope.ttf", variable: "--font-manrope", weight: "200 800", display: "swap" });
export const metadata: Metadata = { title: "AgentCaps | USDC budgets for AI agents", description: "Set USDC spending limits for each agent task, approve recipients, and track payments on Base Sepolia." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="light" className={manrope.variable}><body>{children}</body></html>;
}
