import { BaseError, ContractFunctionRevertedError } from "viem";
const reasons: Record<string, string> = {
  BudgetExceeded: "This payment exceeds the task's remaining budget. No USDC was transferred.",
  AccessRevoked: "The owner revoked this task's spending access. No USDC was transferred.",
  AccessExpired: "This task has expired. No USDC was transferred.",
  RecipientNotApproved: "This recipient is outside the task's approved list. No USDC was transferred.",
  Unauthorized: "This wallet is not authorized to perform that action.",
  DuplicatePayment: "This request has already been paid. It cannot run twice.",
  InvalidAmount: "Enter a positive USDC amount with at most six decimal places.",
  TaskStillActive: "Revoke access or wait for expiry before withdrawing.",
  NothingToWithdraw: "There is no remaining USDC to withdraw.",
  InvalidExpiry: "Choose an expiry in the future.",
  InvalidRecipient: "Use unique, valid recipient addresses. The vault cannot be a recipient."
};
export function readableError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk(cause => cause instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError && reverted.data?.errorName) return reasons[reverted.data.errorName] || reverted.data.errorName;
    if (/rejected|denied/i.test(error.shortMessage)) return "You declined the wallet request. You can try again.";
    if (/insufficient funds/i.test(error.message)) return "This wallet needs test ETH for transaction gas.";
    return error.shortMessage;
  }
  return error instanceof Error ? error.message : "The request failed. Try again.";
}
