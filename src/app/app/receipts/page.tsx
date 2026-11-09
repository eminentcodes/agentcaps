import type { Metadata } from "next";
import { ReceiptsWorkspace } from "@/components/workspace";

export const metadata: Metadata = { title: "Receipts | AgentCaps" };

export default function ReceiptsPage() {
  return <ReceiptsWorkspace />;
}
