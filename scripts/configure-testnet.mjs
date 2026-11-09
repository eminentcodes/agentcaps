import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { privateKeyToAccount } from "viem/accounts";

// Secrets stay in ignored environment files and never appear in command output.
const readEnv = file => fs.existsSync(file)
  ? Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).filter(line => /^[A-Z_]+=.*/.test(line)).map(line => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")];
  }))
  : {};
const target = ".env.local";
const values = readEnv(target);
const testnet = readEnv(".env.testnet.local");
const deployment = fs.existsSync("deployments/testnet.json") ? JSON.parse(fs.readFileSync("deployments/testnet.json", "utf8")) : undefined;
if (deployment && deployment.chainId !== 84532) throw new Error("Expected a Base Sepolia deployment.");
if (fs.existsSync(target)) fs.copyFileSync(target, path.join(os.tmpdir(), `agentcaps-env-before-live-${Date.now()}`));
for (const key of ["LOCAL_OWNER_PRIVATE_KEY", "AGENTCAPS_LOCAL_DEMO", "NEXT_PUBLIC_MERCHANT_ADDRESS", "DEMO_MERCHANT_ADDRESS", "DEPLOYER_PRIVATE_KEY"]) delete values[key];
const agentKey = testnet.AGENT_PRIVATE_KEY || "";
Object.assign(values, {
  NEXT_PUBLIC_CHAIN_ID: "84532",
  NEXT_PUBLIC_VAULT_ADDRESS: deployment?.vault || "",
  NEXT_PUBLIC_USDC_ADDRESS: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  NEXT_PUBLIC_AGENT_ADDRESS: agentKey ? privateKeyToAccount(agentKey).address : deployment?.agent || "",
  NEXT_PUBLIC_DEPLOYMENT_BLOCK: String(deployment?.deploymentBlock || 0),
  NEXT_PUBLIC_RPC_URL: testnet.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  BASE_SEPOLIA_RPC_URL: testnet.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  AGENT_PRIVATE_KEY: agentKey,
});
fs.writeFileSync(target, Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n") + "\n");
console.log(JSON.stringify({ network: "Base Sepolia", vault: deployment?.vault || "Awaiting deployment", agent: values.NEXT_PUBLIC_AGENT_ADDRESS, localOwnerRemoved: true }, null, 2));
