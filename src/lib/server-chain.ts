import "server-only";
import { createPublicClient, createWalletClient, erc20Abi, getAddress, http, isAddress, keccak256, toHex, type Address, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepoliaUsdc, chain } from "./network";
import { vaultAbi } from "./vault";
import type { AppConfig, Workspace, Receipt } from "./types";

const envAddress = (value: string | undefined) => value && isAddress(value) ? getAddress(value) : "";
export const vaultAddress = envAddress(process.env.NEXT_PUBLIC_VAULT_ADDRESS) as Address;
export const tokenAddress = (envAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS) || baseSepoliaUsdc) as Address;
export const rpc = process.env.BASE_SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
export const publicClient = createPublicClient({ chain, transport: http(rpc, { timeout: 15_000, retryCount: 1 }) });
const accountFrom = (key: string | undefined) => key && /^0x[0-9a-fA-F]{64}$/.test(key) ? privateKeyToAccount(key as Hash) : undefined;
export const agentAccount = accountFrom(process.env.AGENT_PRIVATE_KEY);
export function appConfig(): AppConfig {
  const deploymentBlock = Number(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || "0");
  const configured = Boolean(vaultAddress && tokenAddress.toLowerCase() === baseSepoliaUsdc.toLowerCase() && Number.isSafeInteger(deploymentBlock) && deploymentBlock > 0);
  return {
    configured,
    chainId: chain.id,
    network: chain.name,
    vault: vaultAddress || "",
    usdc: tokenAddress,
    agent: envAddress(process.env.NEXT_PUBLIC_AGENT_ADDRESS),
    explorer: chain.blockExplorers.default.url,
    agentReady: Boolean(configured && agentAccount && agentAccount.address.toLowerCase() === process.env.NEXT_PUBLIC_AGENT_ADDRESS?.toLowerCase()),
    deploymentBlock,
  };
}
export async function assertNetwork() {
  if (!appConfig().configured) throw new Error("Deploy the budget vault on Base Sepolia and configure its address and deployment block.");
  if (await publicClient.getChainId() !== chain.id) throw new Error("The RPC must connect to Base Sepolia (84532).");
  const code = await publicClient.getCode({ address: vaultAddress });
  if (!code || code === "0x") throw new Error("The configured vault address has no contract on Base Sepolia.");
  const vaultToken = await publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "usdc" });
  if (vaultToken.toLowerCase() !== tokenAddress.toLowerCase()) throw new Error("The vault does not use the configured Base Sepolia USDC token.");
}
export async function loadWorkspace(owner: Address): Promise<Workspace> {
  await assertNetwork();
  const [taskIds, balance, latestBlock] = await Promise.all([
    publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "getOwnerTaskIds", args: [owner] }),
    publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
    publicClient.getBlockNumber()
  ]);
  const tasks = await Promise.all(taskIds.map(async id => {
    const [task, recipients] = await Promise.all([
      publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "getTask", args: [id] }),
      publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "getRecipients", args: [id] })
    ]);
    return { id: String(id), owner: task.owner, agent: task.agent, name: task.name, budget: String(task.budget), spent: String(task.spent), withdrawn: String(task.withdrawn), remaining: String(task.budget - task.spent - task.withdrawn), createdAt: Number(task.createdAt), expiresAt: Number(task.expiresAt), revoked: task.revoked, recipients: [...recipients] };
  }));
  const receipts: Receipt[] = [];
  if (tasks.length) {
    const knownTasks = new Set(tasks.map(task => task.id));
    const fromBlock = BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || "0");
    const timeCache = new Map<bigint, number>();
    for (let start = fromBlock; start <= latestBlock; start += 2000n) {
      const logs = await publicClient.getContractEvents({ address: vaultAddress, abi: vaultAbi, fromBlock: start, toBlock: start + 1999n > latestBlock ? latestBlock : start + 1999n });
      for (const log of logs) {
        if (log.eventName === "TaskCreated" || !log.args.taskId || !knownTasks.has(String(log.args.taskId))) continue;
        if (log.blockNumber === null || log.transactionHash === null) continue;
        let timestamp = timeCache.get(log.blockNumber);
        if (!timestamp) { timestamp = Number((await publicClient.getBlock({ blockNumber: log.blockNumber })).timestamp); timeCache.set(log.blockNumber, timestamp); }
        if (log.eventName === "PaymentMade") receipts.push({ id: `${log.transactionHash}-${log.logIndex}`, taskId: String(log.args.taskId), recipient: log.args.recipient!, amount: String(log.args.amount), hash: log.transactionHash, timestamp, kind: "payment" });
        if (log.eventName === "FundsWithdrawn") receipts.push({ id: `${log.transactionHash}-${log.logIndex}`, taskId: String(log.args.taskId), recipient: log.args.owner!, amount: String(log.args.amount), hash: log.transactionHash, timestamp, kind: "withdrawal" });
        if (log.eventName === "AccessRevokedForTask") receipts.push({ id: `${log.transactionHash}-${log.logIndex}`, taskId: String(log.args.taskId), recipient: "", amount: "0", hash: log.transactionHash, timestamp, kind: "revocation" });
      }
    }
  }
  return { tasks: tasks.reverse(), balance: String(balance), receipts: receipts.sort((a, b) => b.timestamp - a.timestamp) };
}
// One queue per signer serializes pending nonces in this process. Contract payment IDs enforce durable idempotency.
const globalQueue = globalThis as typeof globalThis & { agentcapsQueue?: Promise<unknown> };
export async function withSignerQueue<T>(action: () => Promise<T>): Promise<T> {
  const next = (globalQueue.agentcapsQueue || Promise.resolve()).catch(() => {}).then(action);
  globalQueue.agentcapsQueue = next.catch(() => {});
  return next;
}
export function walletFor(account: NonNullable<typeof agentAccount>) { return createWalletClient({ account, chain, transport: http(rpc) }); }
export const paymentIdFor = (requestId: string, taskId: string) => keccak256(toHex(`AgentCaps:${chain.id}:${vaultAddress.toLowerCase()}:${taskId}:${requestId}`));
