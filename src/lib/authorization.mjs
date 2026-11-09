import { formatUnits } from "viem";

export function authorizationMessage({ chainId, vault, taskId, recipient, amount, requestId, expiresAt }) {
  return [
    "AgentCaps: authorize one agent payment",
    `Chain: ${chainId}`,
    `Vault: ${vault.toLowerCase()}`,
    `Task: ${taskId}`,
    `Recipient: ${recipient.toLowerCase()}`,
    `Amount: ${formatUnits(BigInt(amount), 6)} USDC`,
    `Request: ${requestId}`,
    `Expires: ${expiresAt}`,
  ].join("\n");
}
export function validAuthorizationTime(expiresAt, now = Math.floor(Date.now() / 1000)) {
  return Number.isSafeInteger(expiresAt) && expiresAt > now && expiresAt <= now + 300;
}
