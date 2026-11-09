import type { Metadata } from "next";
import { NetworkSettings } from "@/components/workspace";

export const metadata: Metadata = { title: "Network settings | AgentCaps" };

export default function SettingsPage() {
  return <NetworkSettings />;
}
