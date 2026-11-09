import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BaseError, ContractFunctionRevertedError, getAddress, isAddress, maxUint256, verifyMessage, type Hash } from "viem";
import { agentAccount, appConfig, assertNetwork, paymentIdFor, publicClient, vaultAddress, walletFor, withSignerQueue } from "@/lib/server-chain";
import { vaultAbi } from "@/lib/vault";
import { authorizationMessage, validAuthorizationTime } from "@/lib/authorization.mjs";
import { readableError } from "@/lib/errors";

const schema = z.object({
  taskId: z.string().regex(/^[1-9]\d*$/).max(78).refine(value => BigInt(value) <= maxUint256),
  recipient: z.string().refine(isAddress),
  amount: z.string().regex(/^[1-9]\d*$/).max(78).refine(value => BigInt(value) <= maxUint256),
  requestId: z.string().uuid(),
  expiresAt: z.number().int(),
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    if (!validAuthorizationTime(input.expiresAt)) {
      return NextResponse.json({ error: "The payment authorization expired or has an invalid validity window." }, { status: 401 });
    }
    await assertNetwork();
    const config = appConfig();
    if (!agentAccount || !config.agentReady) {
      return NextResponse.json({ error: "Configure this task's agent signer before submitting a payment." }, { status: 503 });
    }

    const task = await publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "getTask", args: [BigInt(input.taskId)] });
    const message = authorizationMessage({ ...input, chainId: config.chainId, vault: vaultAddress });
    if (!await verifyMessage({ address: task.owner, message, signature: input.signature as Hash })) {
      return NextResponse.json({ error: "A valid signature from the task owner is required." }, { status: 401 });
    }
    if (task.agent.toLowerCase() !== agentAccount.address.toLowerCase()) {
      return NextResponse.json({ error: "This task uses a different agent wallet. Its assigned agent must submit payments directly to the vault." }, { status: 409 });
    }

    const recipient = getAddress(input.recipient);
    const amount = BigInt(input.amount);
    const paymentId = paymentIdFor(input.requestId, input.taskId);
    const result = await withSignerQueue(async () => {
      if (!validAuthorizationTime(input.expiresAt)) throw new Error("The payment authorization expired while waiting. Authorize a new payment.");
      if (await publicClient.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "usedPaymentId", args: [BigInt(input.taskId), paymentId] })) {
        return { replayed: true as const };
      }
      const { request: transaction } = await publicClient.simulateContract({
        account: agentAccount,
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "pay",
        args: [BigInt(input.taskId), recipient, amount, paymentId],
      });
      const hash = await walletFor(agentAccount!).writeContract(transaction);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The agent transaction reverted. No payment receipt was created.");
      return { replayed: false as const, hash };
    });
    if (result.replayed) return NextResponse.json({ error: "This signed payment has already been executed." }, { status: 409 });
    return NextResponse.json({ status: "confirmed", hash: result.hash, amount: String(amount), recipient });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Send a valid JSON payment request." }, { status: 400 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid task, recipient, amount, and wallet signature." }, { status: 400 });
    const reverted = error instanceof BaseError ? error.walk(cause => cause instanceof ContractFunctionRevertedError) : undefined;
    return NextResponse.json({ status: reverted instanceof ContractFunctionRevertedError ? "blocked" : "error", error: readableError(error) }, { status: reverted instanceof ContractFunctionRevertedError ? 422 : 503 });
  }
}
