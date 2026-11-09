import { parseAbi } from "viem";
export const vaultAbi = parseAbi([
  "function usdc() view returns (address)",
  "function createTask(string name,address agent,uint256 budget,uint64 expiresAt,address[] allowed) returns (uint256 taskId)",
  "function pay(uint256 taskId,address recipient,uint256 amount,bytes32 paymentId)",
  "function revoke(uint256 taskId)", "function withdraw(uint256 taskId)",
  "function getTask(uint256 taskId) view returns ((address owner,address agent,string name,uint256 budget,uint256 spent,uint256 withdrawn,uint64 createdAt,uint64 expiresAt,bool revoked))",
  "function getRecipients(uint256 taskId) view returns (address[])",
  "function getOwnerTaskIds(address owner) view returns (uint256[])",
  "function usedPaymentId(uint256 taskId,bytes32 paymentId) view returns (bool)",
  "event TaskCreated(uint256 indexed taskId,address indexed owner,address indexed agent,string name,uint256 budget,uint64 expiresAt)",
  "event PaymentMade(uint256 indexed taskId,bytes32 indexed paymentId,address indexed recipient,uint256 amount)",
  "event AccessRevokedForTask(uint256 indexed taskId)",
  "event FundsWithdrawn(uint256 indexed taskId,address indexed owner,uint256 amount)",
  "error InvalidToken()", "error InvalidTask()", "error InvalidRecipient()", "error InvalidExpiry()", "error InvalidAmount()", "error TaskNotFound()", "error Unauthorized()", "error AccessRevoked()", "error AccessExpired()", "error RecipientNotApproved()", "error BudgetExceeded(uint256 remaining,uint256 requested)", "error DuplicatePayment()", "error TaskStillActive()", "error NothingToWithdraw()"
]);
