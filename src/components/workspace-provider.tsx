"use client";

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSignMessage, useSwitchChain, useWriteContract } from "wagmi";
import { erc20Abi, formatUnits, getAddress, parseUnits } from "viem";
import { chain, baseSepoliaUsdc } from "@/lib/network";
import { vaultAbi } from "@/lib/vault";
import { authorizationMessage } from "@/lib/authorization.mjs";
import { readableError } from "@/lib/errors";
import { taskStatus, type AppConfig, type Attempt, type BudgetInput, type PaymentInput, type Receipt, type Task, type Workspace } from "@/lib/types";

export const money = (value: string | bigint, minimumFractionDigits = 2) => Number(formatUnits(BigInt(value), 6)).toLocaleString("en-US", { minimumFractionDigits, maximumFractionDigits: 6 });
export const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
export const dateTime = (seconds: number) => new Date(seconds * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

class ApiFailure extends Error {
  constructor(message: string, public outcome?: string) { super(message); }
}

async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new ApiFailure(data.error || "The request failed.", data.status);
  return data;
}

type Notice = { text: string; tone: "success" | "error" | "info" };
type ContextValue = {
  address?: string;
  chainId?: number;
  isConnected: boolean;
  connecting: boolean;
  config?: AppConfig;
  configLoading: boolean;
  configError: Error | null;
  workspace?: Workspace;
  workspaceLoading: boolean;
  workspaceFetching: boolean;
  workspaceError: Error | null;
  walletBalance?: { eth: string; usdc: string };
  walletBalanceLoading: boolean;
  walletBalanceError: Error | null;
  agentGas?: bigint;
  tasks: Task[];
  receipts: Receipt[];
  attempts: Attempt[];
  totals: { funded: bigint; remaining: bigint; spent: bigint; active: number };
  selected?: Task;
  selectedStatus: string;
  selectTask: (id: string) => void;
  now: number;
  canCreate: boolean;
  pending: string | null;
  step: string;
  createOpen: boolean;
  setCreateOpen: Dispatch<SetStateAction<boolean>>;
  revokeOpen: boolean;
  setRevokeOpen: Dispatch<SetStateAction<boolean>>;
  receiptOpen: Receipt | null;
  setReceiptOpen: Dispatch<SetStateAction<Receipt | null>>;
  notice: Notice | null;
  dismissNotice: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  refresh: () => Promise<void>;
  createBudget: (input: BudgetInput) => Promise<boolean>;
  pay: (input: PaymentInput) => Promise<boolean>;
  ownerAction: (action: "revoke" | "withdraw") => Promise<void>;
  copy: (value: string) => Promise<void>;
};

const WorkspaceContext = createContext<ContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient({ chainId: chain.id });
  const configQuery = useQuery({ queryKey: ["config"], queryFn: () => api<AppConfig>("/api/config") });
  const config = configQuery.data;
  const workspaceQuery = useQuery({
    queryKey: ["workspace", chain.id, config?.vault, address],
    queryFn: () => api<Workspace>(`/api/workspace?owner=${address}`),
    enabled: Boolean(isConnected && address && config?.configured),
    refetchInterval: 15_000,
  });
  const walletQuery = useQuery({
    queryKey: ["wallet-balance", chain.id, address],
    queryFn: async () => {
      const [eth, usdc] = await Promise.all([
        publicClient!.getBalance({ address: address! }),
        publicClient!.readContract({ address: baseSepoliaUsdc, abi: erc20Abi, functionName: "balanceOf", args: [address!] }),
      ]);
      return { eth: String(eth), usdc: String(usdc) };
    },
    enabled: Boolean(isConnected && address && publicClient),
    refetchInterval: 15_000,
  });
  const agentGasQuery = useQuery({
    queryKey: ["agent-gas", chain.id, config?.agent],
    queryFn: () => publicClient!.getBalance({ address: getAddress(config!.agent) }),
    enabled: Boolean(config?.agent && publicClient),
    refetchInterval: 30_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState<Receipt | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [step, setStep] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const attemptsKey = `agentcaps-attempts:${chain.id}:${config?.vault}:${address}`;

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    setSelectedId(null);
    setReceiptOpen(null);
    setCreateOpen(false);
    setRevokeOpen(false);
    try {
      const saved = JSON.parse(localStorage.getItem(attemptsKey) || "[]");
      setAttempts(Array.isArray(saved) ? saved.filter(item => item && item.status === "blocked" && typeof item.reason === "string" && typeof item.recipient === "string" && typeof item.amount === "string" && /^\d+$/.test(item.amount)).slice(0, 100) : []);
    } catch { setAttempts([]); }
  }, [attemptsKey]);

  const workspace = workspaceQuery.data;
  const tasks = workspace?.tasks || [];
  const receipts = workspace?.receipts || [];
  const selected = tasks.find(task => task.id === selectedId) || tasks[0];
  const selectedStatus = selected ? taskStatus(selected, now) : "";
  const totals = useMemo(() => tasks.reduce((result, task) => ({
    funded: result.funded + BigInt(task.budget),
    remaining: result.remaining + BigInt(task.remaining),
    spent: result.spent + BigInt(task.spent),
    active: result.active + Number(taskStatus(task, now) === "active"),
  }), { funded: 0n, remaining: 0n, spent: 0n, active: 0 }), [tasks, now]);
  const showNotice = (text: string, tone: Notice["tone"] = "success") => setNotice({ text, tone });

  async function connectWallet() {
    try {
      if (!connectors[0]) throw new Error("Install a wallet such as MetaMask or Coinbase Wallet, then connect it here.");
      await connectAsync({ connector: connectors[0] });
    } catch (error) { showNotice(readableError(error), "error"); }
  }
  async function switchNetwork() {
    try { await switchChainAsync({ chainId: chain.id }); }
    catch (error) { showNotice(readableError(error), "error"); }
  }
  async function readyWallet() {
    if (!isConnected || !address) throw new Error("Connect your owner wallet first.");
    if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id });
    if (!publicClient) throw new Error("The Base Sepolia connection is unavailable.");
  }
  async function refresh() {
    await Promise.all([
      configQuery.refetch(),
      ...(isConnected && config?.configured ? [workspaceQuery.refetch()] : []),
      ...(isConnected ? [walletQuery.refetch()] : []),
      ...(config?.agent ? [agentGasQuery.refetch()] : []),
    ]);
  }
  async function createBudget(input: BudgetInput) {
    if (!config?.configured || pending) return false;
    setPending("create");
    setStep("Approve the exact USDC budget in your wallet");
    try {
      await readyWallet();
      const amount = parseUnits(input.budget, 6);
      const approval = await writeContractAsync({ chainId: chain.id, address: getAddress(config.usdc), abi: erc20Abi, functionName: "approve", args: [getAddress(config.vault), amount] });
      const approvalReceipt = await publicClient!.waitForTransactionReceipt({ hash: approval });
      if (approvalReceipt.status !== "success") throw new Error("The USDC approval reverted.");
      setStep("Confirm the budget deposit in your wallet");
      const hash = await writeContractAsync({ chainId: chain.id, address: getAddress(config.vault), abi: vaultAbi, functionName: "createTask", args: [input.name, getAddress(input.agent), amount, BigInt(input.expiresAt), input.recipients.map(getAddress)] });
      setStep("Waiting for the deposit to confirm on Base Sepolia");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The budget deposit reverted.");
      const refreshed = await workspaceQuery.refetch();
      await walletQuery.refetch();
      setSelectedId(refreshed.data?.tasks[0]?.id || null);
      setCreateOpen(false);
      showNotice(`“${input.name}” is funded with ${input.budget} USDC on Base Sepolia.`);
      return true;
    } catch (error) { showNotice(readableError(error), "error"); return false; }
    finally { setPending(null); setStep(""); }
  }
  async function ownerAction(action: "revoke" | "withdraw") {
    if (!selected || !config || pending) return;
    setPending(action);
    setStep(`Confirm ${action === "revoke" ? "revocation" : "withdrawal"} in your wallet`);
    try {
      await readyWallet();
      const hash = await writeContractAsync({ chainId: chain.id, address: getAddress(config.vault), abi: vaultAbi, functionName: action, args: [BigInt(selected.id)] });
      setStep("Waiting for confirmation on Base Sepolia");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The transaction reverted.");
      await Promise.all([workspaceQuery.refetch(), walletQuery.refetch()]);
      setRevokeOpen(false);
      showNotice(action === "revoke" ? "Access revoked. The agent can no longer spend from this budget." : `${money(selected.remaining)} USDC returned to your wallet.`);
    } catch (error) { showNotice(readableError(error), "error"); }
    finally { setPending(null); setStep(""); }
  }
  async function pay(payment: PaymentInput) {
    if (!selected || !config || pending) return false;
    setPending("payment");
    setStep("Approve this payment request in your wallet");
    const input = { taskId: selected.id, recipient: getAddress(payment.recipient), amount: payment.amount, requestId: crypto.randomUUID(), expiresAt: Math.floor(Date.now() / 1000) + 240 };
    try {
      await readyWallet();
      const signature = await signMessageAsync({ message: authorizationMessage({ ...input, chainId: chain.id, vault: config.vault }) });
      setStep("The agent is submitting your payment to Base Sepolia");
      const result = await api<{ hash: string; amount: string; recipient: string }>("/api/agent/pay", { ...input, signature });
      await Promise.all([workspaceQuery.refetch(), agentGasQuery.refetch()]);
      showNotice(`${money(result.amount)} USDC paid to ${shortAddress(result.recipient)}. The confirmed receipt is ready.`);
      return true;
    } catch (error) {
      const reason = readableError(error);
      if (error instanceof ApiFailure && error.outcome === "blocked") {
        const attempt: Attempt = { id: input.requestId, taskId: selected.id, recipient: input.recipient, amount: input.amount, status: "blocked", reason, timestamp: Math.floor(Date.now() / 1000) };
        const next = [attempt, ...attempts].slice(0, 100);
        setAttempts(next);
        try { localStorage.setItem(attemptsKey, JSON.stringify(next)); } catch { /* The visible rejection remains available without browser storage. */ }
      }
      showNotice(reason, "error");
      await workspaceQuery.refetch();
      return false;
    } finally { setPending(null); setStep(""); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); showNotice("Copied to clipboard.", "info"); }
    catch { showNotice("Select the address and copy it manually; the clipboard is unavailable.", "error"); }
  }

  return <WorkspaceContext.Provider value={{
    address, chainId, isConnected, connecting, config,
    configLoading: configQuery.isLoading, configError: configQuery.error,
    workspace, workspaceLoading: workspaceQuery.isLoading, workspaceFetching: workspaceQuery.isFetching, workspaceError: workspaceQuery.error,
    walletBalance: walletQuery.data, walletBalanceLoading: walletQuery.isLoading, walletBalanceError: walletQuery.error, agentGas: agentGasQuery.data,
    tasks, receipts, attempts, totals, selected, selectedStatus, selectTask: setSelectedId, now,
    canCreate: Boolean(config?.configured && isConnected && chainId === chain.id && walletQuery.data && !pending),
    pending, step, createOpen, setCreateOpen, revokeOpen, setRevokeOpen, receiptOpen, setReceiptOpen, notice,
    dismissNotice: () => setNotice(null), connectWallet, disconnectWallet: disconnect, switchNetwork, refresh, createBudget, pay, ownerAction, copy,
  }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Workspace components must be inside WorkspaceProvider.");
  return workspace;
}
