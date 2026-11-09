import type { Metadata } from "next";
import { BudgetWorkspace } from "@/components/workspace";

export const metadata: Metadata = { title: "Task budgets | AgentCaps" };

export default function BudgetsPage() {
  return <BudgetWorkspace />;
}
