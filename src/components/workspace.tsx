"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther, isAddress, maxUint256, parseUnits } from "viem";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, ArrowsClockwise, CheckCircle, CircleNotch, Clock, Coins, Copy, Cpu, MagnifyingGlass, Plus, Receipt as ReceiptIcon, ShieldCheck, ShieldSlash, SignOut, Stack, Wallet, WarningCircle } from "@phosphor-icons/react";
import { Button, Modal, RevokeDialog } from "./ui";
import { dateTime, money, shortAddress, useWorkspace } from "./workspace-provider";
import { readableError } from "@/lib/errors";
import { taskStatus, type Attempt, type Receipt, type Task } from "@/lib/types";

function PageHeading({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}

function EmptyState({ icon: Icon, title, body, children }: { icon: typeof Stack; title: string; body: string; children?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={28} weight="duotone" /></div><h3>{title}</h3><p>{body}</p>{children}</div>;
}

function Status({ task, now }: { task: Task; now: number }) {
  const status = taskStatus(task, now);
  return <span className={`status status-${status}`}>{status === "active" && <span aria-hidden="true" className="semantic-dot" />}{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function Metrics() {
  const { workspace, totals, tasks, receipts, isConnected, config, workspaceLoading } = useWorkspace();
  const waiting = !isConnected ? "Connect wallet" : !config?.configured ? "Awaiting deployment" : workspaceLoading ? "Loading…" : "Unavailable";
  const metrics = [
    { label: "Total funded", value: totals.funded, detail: `${tasks.length} task ${tasks.length === 1 ? "budget" : "budgets"}`, icon: Coins },
    { label: "Available to spend", value: totals.remaining, detail: `${totals.active} active ${totals.active === 1 ? "task" : "tasks"}`, icon: Wallet },
    { label: "Payments sent", value: totals.spent, detail: `${receipts.filter(receipt => receipt.kind === "payment").length} confirmed payments`, icon: ArrowUpRight },
  ];
  return <div className="metrics-strip">{metrics.map(({ label, value, detail, icon: Icon }) => <div className="metric" key={label}><span>{label}<Icon size={19} /></span><div className={`metric-value ${!workspace ? "metric-placeholder" : ""}`}>{workspace ? <>{money(value)}<small>USDC</small></> : waiting}</div><p>{workspace ? detail : "Read from Base Sepolia"}</p></div>)}</div>;
}

export function BudgetWorkspace() {
  const { tasks, selected, selectTask, now, config, isConnected, connecting, workspace, workspaceLoading, workspaceFetching, workspaceError, canCreate, setCreateOpen, connectWallet, refresh, receipts, attempts } = useWorkspace();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const visibleTasks = tasks.filter(task => (filter === "all" || (filter === "active" ? taskStatus(task, now) === "active" : taskStatus(task, now) !== "active")) && `${task.name} ${task.id}`.toLowerCase().includes(search.toLowerCase()));

  return <>
    <PageHeading title="Budgets" description="Fund a task, approve recipients, and track its remaining USDC."><Button onClick={() => setCreateOpen(true)} disabled={!canCreate}><Plus size={18} weight="bold" />Create budget</Button></PageHeading>
    <Metrics />
    <div className="budget-layout">
      <section className="budget-list-panel" aria-labelledby="budgets-heading">
        <div className="panel-heading"><h2 id="budgets-heading">Your budgets{workspace && <span>{tasks.length}</span>}</h2><button className="icon-button" aria-label="Refresh budgets" onClick={refresh} disabled={!isConnected || workspaceFetching}><ArrowsClockwise size={19} className={workspaceFetching ? "spinner" : ""} /></button></div>
        <div className="list-toolbar"><div className="filter-tabs" aria-label="Filter budgets">{["all", "active", "inactive"].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "active" : ""}>{value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div><label className="search-box"><MagnifyingGlass size={17} /><input aria-label="Search budgets" placeholder="Find a task…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
        <div className="list-column-labels"><span>TASK / AGENT</span><span>REMAINING</span></div>
        {!isConnected && <EmptyState icon={Wallet} title="Connect a wallet to view budgets" body="Budgets and payment history are tied to their owner wallet."><Button variant="secondary" onClick={connectWallet} busy={connecting}><Wallet size={18} />Connect wallet</Button></EmptyState>}
        {isConnected && !config?.configured && <EmptyState icon={ShieldCheck} title="Budget funding is unavailable" body="The vault has not been deployed on Base Sepolia. Your wallet balances are available in Settings."><Link className="button button-secondary" href="/app/settings">Open settings <ArrowRight size={17} /></Link></EmptyState>}
        {workspaceLoading && <div className="loading-state" role="status"><CircleNotch size={25} className="spinner" />Reading your onchain budgets…</div>}
        {isConnected && config?.configured && workspaceError && <EmptyState icon={WarningCircle} title="The network connection needs a retry" body="Your budget data is temporarily unavailable. Reconnect to read the latest state."><Button variant="secondary" onClick={refresh}>Retry connection</Button></EmptyState>}
        {workspace && !workspaceLoading && visibleTasks.length === 0 && <EmptyState icon={Stack} title={tasks.length ? "No matching budgets" : "No budgets yet"} body={tasks.length ? "Try a different filter or search." : "Create a budget to fund your first agent task."}>{tasks.length ? <Button variant="secondary" onClick={() => { setFilter("all"); setSearch(""); }}>Clear filters</Button> : <Button variant="secondary" onClick={() => setCreateOpen(true)} disabled={!canCreate}><Plus size={18} />Create budget</Button>}</EmptyState>}
        <div className="task-rows">{visibleTasks.map(task => <button key={task.id} className={`task-row ${selected?.id === task.id ? "selected" : ""}`} onClick={() => selectTask(task.id)} aria-pressed={selected?.id === task.id}><div className="task-main"><span className="task-icon"><Cpu size={23} weight="duotone" /></span><div><strong>{task.name}</strong><span className="task-meta"><Status task={task} now={now} /><span>Task #{task.id}</span></span></div></div><div className="task-balance"><strong>{money(task.remaining)}<small>USDC</small></strong><span>of {money(task.budget)}</span></div></button>)}</div>
        <div className="list-footnote"><ShieldCheck size={16} />Limits are checked on every payment.</div>
      </section>
      <TaskDetail />
    </div>
    <section className="activity-panel" aria-labelledby="activity-heading"><div className="panel-heading"><div><h2 id="activity-heading">Recent activity</h2><p>{selected ? `Payments and access changes for ${selected.name}` : "The receipts for your selected budget appear here."}</p></div><Link className="text-link" href="/app/receipts">All receipts <ArrowUpRight size={15} /></Link></div><Activity receipts={receipts.filter(receipt => receipt.taskId === selected?.id)} attempts={attempts.filter(attempt => attempt.taskId === selected?.id)} /></section>
  </>;
}

function TaskDetail() {
  const { selected, selectedStatus, now, config, pending, setRevokeOpen, ownerAction, copy } = useWorkspace();
  return <motion.section className="task-detail-panel" initial={false} animate={{ opacity: 1 }} aria-label="Selected task details">
    {selected ? <>
      <div className="detail-header"><span className="task-icon detail-icon"><Cpu size={25} weight="duotone" /></span><Status task={selected} now={now} /></div>
      <h2>{selected.name}</h2><p className="detail-subtitle">Task #{selected.id} · Created {dateTime(selected.createdAt)}</p>
      <div className="balance-display"><span>Remaining budget</span><strong>{money(selected.remaining)}<small>USDC</small></strong><div className="budget-meter" role="meter" aria-label="Budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(BigInt(selected.spent) * 100n / BigInt(selected.budget))} aria-valuetext={`${money(selected.spent)} of ${money(selected.budget)} USDC spent`}><div style={{ width: `${Number((BigInt(selected.spent) + BigInt(selected.withdrawn)) * 100n / BigInt(selected.budget))}%` }} /></div><div className="budget-meter-labels"><span>{money(selected.spent)} spent</span><span>{money(selected.budget)} funded</span></div></div>
      <dl className="task-rules"><div><dt><Cpu size={17} />Agent wallet</dt><dd><button onClick={() => copy(selected.agent)} title={selected.agent} aria-label="Copy agent wallet address">{shortAddress(selected.agent)}<Copy size={14} /></button></dd></div><div><dt><Clock size={17} />Access expires</dt><dd>{dateTime(selected.expiresAt)}</dd></div><div><dt><ShieldCheck size={17} />Approved recipients</dt><dd>{selected.recipients.length}</dd></div></dl>
      <div className="recipient-list">{selected.recipients.map(recipient => <div key={recipient}><span className="recipient-icon"><Coins size={18} /></span><div><strong>Approved recipient</strong><button onClick={() => copy(recipient)} title={recipient} aria-label={`Copy recipient ${recipient}`}>{shortAddress(recipient)}<Copy size={13} /></button></div><a href={`${config?.explorer}/address/${recipient}`} target="_blank" rel="noreferrer" aria-label={`View recipient ${recipient} on Basescan`}><CheckCircle size={21} className="approved-icon" weight="fill" /></a></div>)}</div>
      <PaymentForm />
      <div className="task-controls"><Button variant="secondary" disabled={Boolean(pending) || selectedStatus !== "active"} onClick={() => setRevokeOpen(true)}><ShieldSlash size={18} />Revoke access</Button><Button variant="ghost" busy={pending === "withdraw"} disabled={Boolean(pending) || !["revoked", "expired"].includes(selectedStatus) || selected.remaining === "0"} onClick={() => ownerAction("withdraw")}><ArrowDownLeft size={18} />Withdraw remaining</Button></div>
    </> : <EmptyState icon={ShieldCheck} title="Select a budget" body="Choose a task to view its cap, recipients, expiry, and payments." />}
  </motion.section>;
}

function PaymentForm() {
  const { selected, selectedStatus, config, agentGas, pending, pay } = useWorkspace();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setRecipient(""); setAmount(""); setError(""); }, [selected?.id]);
  if (!selected) return null;
  const supportedAgent = Boolean(config?.agentReady && selected.agent.toLowerCase() === config.agent.toLowerCase());

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!/^\d+(\.\d{1,6})?$/.test(amount)) return setError("Enter an amount with up to six decimal places.");
    const value = parseUnits(amount, 6);
    if (value <= 0n) return setError("Enter a positive payment amount.");
    if (value > BigInt(selected!.remaining)) return setError("This payment exceeds the remaining budget.");
    if (!selected!.recipients.includes(recipient)) return setError("Choose an approved recipient.");
    if (await pay({ recipient, amount: String(value) })) setAmount("");
  }

  return <div className="payment-box"><div className="runner-heading"><span><Cpu size={18} />Agent payment</span></div>
    {supportedAgent ? <form onSubmit={submit}>
      <label htmlFor="payment-recipient">Approved recipient</label><select id="payment-recipient" value={recipient} onChange={event => setRecipient(event.target.value)} disabled={Boolean(pending) || selectedStatus !== "active"} required><option value="" disabled>Choose a recipient</option>{selected.recipients.map(address => <option key={address} value={address}>{shortAddress(address)}</option>)}</select>
      <label htmlFor="payment-amount">Payment amount</label><div className="amount-input"><input id="payment-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} disabled={Boolean(pending) || selectedStatus !== "active"} required /><span>USDC</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {agentGas === 0n && <p className="payment-note">The agent wallet needs Base Sepolia ETH for transaction gas.</p>}
      <Button type="submit" className="run-button" busy={pending === "payment"} disabled={Boolean(pending) || selectedStatus !== "active" || agentGas === 0n}>{pending === "payment" ? "Confirming payment" : "Approve payment"}<ArrowRight size={18} /></Button>
      <p className="payment-note">Your signature authorizes this exact amount and recipient. The vault checks the budget before sending USDC.</p>
    </form> : <p className="payment-note">This budget is assigned to {shortAddress(selected.agent)}. That agent can submit payments directly to the vault within your rules.</p>}
  </div>;
}

function Activity({ receipts, attempts }: { receipts: Receipt[]; attempts: Attempt[] }) {
  const { setReceiptOpen } = useWorkspace();
  const reduced = useReducedMotion();
  const rows = [...receipts.map(item => ({ type: "receipt" as const, item })), ...attempts.map(item => ({ type: "attempt" as const, item }))].sort((a, b) => b.item.timestamp - a.item.timestamp).slice(0, 30);
  if (!rows.length) return <div className="activity-empty"><ReceiptIcon size={25} weight="duotone" /><div><strong>No transactions yet</strong><p>Confirmed payments, revocations, and withdrawals appear here.</p></div></div>;
  return <><div className="activity-table"><div className="activity-columns"><span>ACTIVITY</span><span>AMOUNT</span><span>STATUS</span><span>TIME</span><span /></div>{rows.map(row => <motion.div layout={!reduced} initial={false} animate={{ opacity: 1 }} key={row.item.id} className={`activity-row ${row.type === "attempt" ? "blocked" : ""}`}>
    {row.type === "receipt" ? <><div className="activity-description"><span className={`activity-icon ${row.item.kind}`}>{row.item.kind === "payment" ? <ArrowUpRight size={18} /> : row.item.kind === "withdrawal" ? <ArrowDownLeft size={18} /> : <ShieldSlash size={18} />}</span><div><strong>{row.item.kind === "payment" ? "Agent payment" : row.item.kind === "withdrawal" ? "Funds returned to owner" : "Spending access revoked"}</strong><span>Task #{row.item.taskId}{row.item.recipient ? ` · ${shortAddress(row.item.recipient)}` : ""}</span></div></div><span className="activity-amount">{row.item.kind === "revocation" ? "No transfer" : `${money(row.item.amount)} USDC`}</span><span className="status status-confirmed"><CheckCircle size={14} />Confirmed</span><time dateTime={new Date(row.item.timestamp * 1000).toISOString()}>{dateTime(row.item.timestamp)}</time><button className="icon-button" aria-label={`View receipt for task ${row.item.taskId}`} onClick={() => setReceiptOpen(row.item)}><ArrowUpRight size={18} /></button></> : <><div className="activity-description"><span className="activity-icon blocked"><ShieldSlash size={18} /></span><div><strong>Payment blocked</strong><span title={row.item.reason}>{row.item.reason}</span></div></div><span className="activity-amount">{money(row.item.amount)} requested</span><span className="status status-blocked">Blocked</span><time dateTime={new Date(row.item.timestamp * 1000).toISOString()}>{dateTime(row.item.timestamp)}</time><span /></>}
  </motion.div>)}</div>{attempts.length > 0 && <p className="local-activity-note">Blocked requests are contract simulations stored in this browser. They did not transfer funds.</p>}</>;
}

export function ReceiptsWorkspace() {
  const { receipts, attempts, isConnected, connecting, connectWallet, workspaceLoading } = useWorkspace();
  return <><PageHeading title="Payments" description="View confirmed transfers and access changes on Base Sepolia." /><section className="activity-panel receipts-page" aria-labelledby="activity-heading"><div className="panel-heading"><div><h2 id="activity-heading">Transaction history</h2><p>Payments, withdrawals, and access changes across your budgets.</p></div><span className="receipt-count"><ReceiptIcon size={18} />{isConnected ? `${receipts.length} transactions` : "Wallet not connected"}</span></div>{!isConnected ? <EmptyState icon={Wallet} title="Connect a wallet to view payments" body="Use the wallet that owns the budgets you want to view."><Button variant="secondary" onClick={connectWallet} busy={connecting}><Wallet size={18} />Connect wallet</Button></EmptyState> : workspaceLoading ? <div className="loading-state" role="status"><CircleNotch size={25} className="spinner" />Reading confirmed receipts…</div> : <Activity receipts={receipts} attempts={attempts} />}</section></>;
}

export function NetworkSettings() {
  const { address, isConnected, connecting, chainId, config, walletBalance, walletBalanceLoading, walletBalanceError, agentGas, connectWallet, disconnectWallet, switchNetwork, refresh, copy } = useWorkspace();
  const explorer = config?.explorer || "https://sepolia.basescan.org";
  function addressValue(value: string | undefined, placeholder: string) {
    return value ? <div className="settings-address"><a href={`${explorer}/address/${value}`} target="_blank" rel="noreferrer">{value}<ArrowUpRight size={14} /></a><button className="icon-button" aria-label={`Copy address ${value}`} onClick={() => copy(value)}><Copy size={16} /></button></div> : <span className="settings-placeholder">{placeholder}</span>;
  }
  return <>
    <PageHeading title="Settings" description="Manage your wallet connection and Base Sepolia configuration."><Button variant="secondary" onClick={refresh}><ArrowsClockwise size={18} />Refresh connection</Button></PageHeading>
    <div className="settings-layout">
      <section className="connection-panel"><div className="connection-heading"><span className="empty-icon"><Wallet size={27} weight="duotone" /></span><div><h2>Wallet</h2><p>{isConnected ? "Reading balances on Base Sepolia." : "Connect the wallet that owns your budgets."}</p></div></div>{address && <div className="connected-address">{addressValue(address, "")}</div>}
        {isConnected ? <><div className="wallet-balances"><div><span>Test USDC</span><strong>{walletBalance ? money(walletBalance.usdc) : walletBalanceLoading ? "Loading…" : "Unavailable"}</strong></div><div><span>Test ETH for gas</span><strong>{walletBalance ? Number(formatEther(BigInt(walletBalance.eth))).toLocaleString("en-US", { maximumFractionDigits: 6 }) : walletBalanceLoading ? "Loading…" : "Unavailable"}</strong></div></div>{walletBalanceError && <p className="form-error" role="alert">Could not read the live wallet balance. Refresh the connection to retry.</p>}<div className="connection-actions">{chainId !== 84532 && <Button onClick={switchNetwork}>Switch to Base Sepolia</Button>}<Button variant="secondary" onClick={disconnectWallet}><SignOut size={18} />Disconnect wallet</Button></div></> : <Button onClick={connectWallet} busy={connecting}><Wallet size={18} />Connect wallet</Button>}
        <p className="settings-note">Wallet balances are read from Base Sepolia. USDC funds the budget; ETH pays transaction gas.</p>
      </section>
      <section className="settings-panel"><div className="panel-heading"><div><h2>Contracts &amp; agent</h2><p>Base Sepolia contract and signer addresses.</p></div><ShieldCheck size={23} weight="duotone" /></div><dl className="settings-list"><div><dt>Network</dt><dd>Base Sepolia <span className="settings-placeholder">(84532)</span></dd></div><div><dt>Budget vault</dt><dd>{addressValue(config?.vault, "Deployment pending")}</dd></div><div><dt>USDC token</dt><dd>{addressValue(config?.usdc, "Loading configuration…")}</dd></div><div><dt>Agent wallet</dt><dd>{addressValue(config?.agent, "Not configured")}</dd></div><div><dt>Agent gas</dt><dd>{agentGas !== undefined ? `${formatEther(agentGas)} test ETH` : config?.agent ? "Reading live balance…" : "Connect an agent first"}</dd></div></dl><p className="settings-note">Owner transactions are signed in your connected wallet. The app&apos;s agent signs only owner-authorized payments from its assigned tasks.</p></section>
    </div>
    <div className="testnet-help"><ShieldCheck size={24} /><div><h2>Get test funds</h2><p>Fund budgets with test USDC. Your wallet and the agent need test ETH for gas.</p></div><Link className="text-link" href="/guide">Setup guide <ArrowUpRight size={16} /></Link></div>
  </>;
}

export function WorkspaceDialogs() {
  const { selected, revokeOpen, setRevokeOpen, pending, ownerAction, receiptOpen, setReceiptOpen, config, copy } = useWorkspace();
  return <>
    <CreateBudget />
    {selected && <RevokeDialog open={revokeOpen} onOpenChange={value => { if (!pending) setRevokeOpen(value); }} name={selected.name} busy={pending === "revoke"} onConfirm={() => ownerAction("revoke")} />}
    <Modal open={Boolean(receiptOpen)} onOpenChange={open => { if (!open) setReceiptOpen(null); }} title="Transaction receipt" description="This record comes from a confirmed contract event.">{receiptOpen && <><dl className="settings-list"><div><dt>Action</dt><dd>{receiptOpen.kind}</dd></div><div><dt>Task</dt><dd>#{receiptOpen.taskId}</dd></div><div><dt>Amount</dt><dd>{money(receiptOpen.amount)} USDC</dd></div>{receiptOpen.recipient && <div><dt>Recipient</dt><dd>{receiptOpen.recipient}</dd></div>}<div><dt>Confirmed</dt><dd>{dateTime(receiptOpen.timestamp)}</dd></div><div><dt>Transaction hash</dt><dd><button className="address-copy" onClick={() => copy(receiptOpen.hash)}>{receiptOpen.hash}<Copy size={15} /></button></dd></div></dl><a className="button button-primary receipt-explorer" href={`${config?.explorer}/tx/${receiptOpen.hash}`} target="_blank" rel="noreferrer">View on Basescan <ArrowUpRight size={18} /></a></>}</Modal>
  </>;
}

function CreateBudget() {
  const { createOpen, setCreateOpen, config, walletBalance, createBudget, pending, step } = useWorkspace();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [agent, setAgent] = useState("");
  const [recipientText, setRecipientText] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const busy = pending === "create";

  useEffect(() => {
    if (!createOpen) return;
    setName(""); setBudget(""); setAgent(config?.agent || ""); setRecipientText(""); setError("");
    const future = new Date(Date.now() + 24 * 3600_000);
    setExpiry(new Date(future.getTime() - future.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
  }, [createOpen, config?.agent]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      const recipients = recipientText.split(/[\s,]+/).filter(Boolean);
      const expiresAt = Math.floor(new Date(expiry).getTime() / 1000);
      if (!name.trim() || new TextEncoder().encode(name.trim()).length > 96) return setError("Use a task name between 1 and 96 bytes.");
      if (!/^\d+(\.\d{1,6})?$/.test(budget) || parseUnits(budget, 6) <= 0n || parseUnits(budget, 6) > maxUint256) return setError("Enter a positive USDC budget with up to six decimal places.");
      if (!walletBalance) return setError("Wait for your live wallet balance, then try again.");
      if (parseUnits(budget, 6) > BigInt(walletBalance.usdc)) return setError("The budget exceeds your wallet's test USDC balance.");
      if (!isAddress(agent) || /^0x0{40}$/i.test(agent)) return setError("Enter a valid, nonzero agent wallet address.");
      if (!recipients.length || recipients.length > 10 || recipients.some(value => !isAddress(value) || /^0x0{40}$/i.test(value) || value.toLowerCase() === config?.vault.toLowerCase())) return setError("Use 1 to 10 valid recipient addresses. The vault cannot be a recipient.");
      if (new Set(recipients.map(value => value.toLowerCase())).size !== recipients.length) return setError("Each recipient must appear only once.");
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() / 1000) return setError("Choose an expiry in the future.");
      await createBudget({ name: name.trim(), budget, agent, expiresAt, recipients });
    } catch (error) { setError(readableError(error)); }
  }

  return <Modal open={createOpen} onOpenChange={value => { if (!pending) setCreateOpen(value); }} title="Create a task budget" description="Set the rules once. The vault checks them on every payment."><form className="budget-form" onSubmit={submit}><label htmlFor="task-name">Task name</label><input id="task-name" placeholder="e.g. Agent API spending" value={name} onChange={event => setName(event.target.value)} maxLength={96} required disabled={busy} /><div className="form-two-columns"><div><label htmlFor="budget">Budget</label><div className="amount-input"><input id="budget" inputMode="decimal" placeholder="0.00" value={budget} onChange={event => setBudget(event.target.value)} required disabled={busy} /><span>USDC</span></div><p>Wallet: {walletBalance ? money(walletBalance.usdc) : "Loading…"} test USDC</p></div><div><label htmlFor="expiry">Access expires</label><input type="datetime-local" id="expiry" value={expiry} onChange={event => setExpiry(event.target.value)} required disabled={busy} /><p>Your local time</p></div></div><label htmlFor="agent-address">Agent wallet</label><input id="agent-address" className="mono-input" value={agent} onChange={event => setAgent(event.target.value)} placeholder="0x…" required disabled={busy} /><p className="field-helper">Only this wallet can spend the task&apos;s funds.</p><label htmlFor="recipient-addresses">Approved recipients</label><textarea id="recipient-addresses" className="mono-input" value={recipientText} onChange={event => setRecipientText(event.target.value)} rows={2} placeholder="One recipient address per line" required disabled={busy} /><p className="field-helper">Up to 10 addresses. Budget and recipients are fixed after creation.</p><div className="form-notice"><ShieldCheck size={19} />Approve the exact budget in your wallet, then confirm its deposit. Unused USDC can be recovered after revocation or expiry.</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" busy={busy}>{busy ? "Creating budget" : "Create and fund"}<ArrowRight size={18} /></Button></div>{busy && <p className="form-progress" role="status">{step}</p>}</form></Modal>;
}
