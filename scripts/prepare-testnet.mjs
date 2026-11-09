import fs from "node:fs";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
const file = ".env.testnet.local";
if (!fs.existsSync(file)) {
  const deployerKey = generatePrivateKey();
  const agentKey = generatePrivateKey();
  const merchantKey = generatePrivateKey();
  const merchant = privateKeyToAccount(merchantKey);
  fs.writeFileSync(file, ["# Generated for Base Sepolia only. Keep this file private.", "BASE_SEPOLIA_RPC_URL=https://sepolia.base.org", `DEPLOYER_PRIVATE_KEY=${deployerKey}`, `AGENT_PRIVATE_KEY=${agentKey}`, `MERCHANT_PRIVATE_KEY=${merchantKey}`, `DEMO_MERCHANT_ADDRESS=${merchant.address}`, ""].join("\n"));
}
process.loadEnvFile(file);
const wallets = { chainId: 84532, deployer: privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY).address, agent: privateKeyToAccount(process.env.AGENT_PRIVATE_KEY).address, merchant: process.env.DEMO_MERCHANT_ADDRESS };
fs.mkdirSync("deployments", { recursive: true });
fs.writeFileSync("deployments/testnet-wallets.json", JSON.stringify(wallets, null, 2));
console.log(JSON.stringify({ ...wallets, note: "Fund the deployer and agent with Base Sepolia test ETH. The owner wallet needs test USDC separately. Private keys are stored only in the ignored .env.testnet.local." }, null, 2));
