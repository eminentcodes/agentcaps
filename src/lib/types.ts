export type Task = { id: string; owner: string; agent: string; name: string; budget: string; spent: string; withdrawn: string; remaining: string; createdAt: number; expiresAt: number; revoked: boolean; recipients: string[] };
export type Receipt = { id: string; taskId: string; recipient: string; amount: string; hash: string; timestamp: number; kind: "payment" | "withdrawal" | "revocation" };
export type Attempt = { id: string; taskId: string; recipient: string; amount: string; status: "blocked"; reason: string; timestamp: number };
export type AppConfig = { configured: boolean; chainId: number; network: string; vault: string; usdc: string; agent: string; explorer: string; agentReady: boolean; deploymentBlock: number };
export type Workspace = { tasks: Task[]; receipts: Receipt[]; balance: string };
export type BudgetInput = { name: string; budget: string; agent: string; expiresAt: number; recipients: string[] };
export type PaymentInput = { recipient: string; amount: string };
export function taskStatus(task: Task, now = Date.now() / 1000) { return task.withdrawn !== "0" ? "closed" : task.revoked ? "revoked" : now >= task.expiresAt ? "expired" : task.remaining === "0" ? "exhausted" : "active"; }
