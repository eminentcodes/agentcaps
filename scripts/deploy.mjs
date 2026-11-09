import fs from "node:fs";
import { ethers } from "ethers";
const mode = process.argv[2];
if (!["local", "testnet"].includes(mode)) throw new Error("Use local or testnet.");
const isLocal = mode === "local";
const rpc = isLocal ? "http://127.0.0.1:8545" : process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const provider = new ethers.JsonRpcProvider(rpc);
const { chainId } = await provider.getNetwork();
if (chainId !== (isLocal ? 31337n : 84532n)) throw new Error("Deployment refused: wrong chain. Only local development and Base Sepolia are supported.");
const localWallet = index => ethers.HDNodeWallet.fromPhrase("test test test test test test test test test test test junk", undefined, `m/44'/60'/0'/0/${index}`);
const owner = isLocal ? await provider.getSigner(0) : new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || "", provider);
const agent = isLocal ? localWallet(1) : new ethers.Wallet(process.env.AGENT_PRIVATE_KEY || "");
const merchant = isLocal ? localWallet(2).address : process.env.DEMO_MERCHANT_ADDRESS;
if (!merchant || !ethers.isAddress(merchant) || merchant === ethers.ZeroAddress) throw new Error("Set DEMO_MERCHANT_ADDRESS to a testnet payment recipient.");
const artifact = name => JSON.parse(fs.readFileSync(`artifacts/contracts/${name}.json`, "utf8"));
let tokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
if (isLocal) {
  const mock = artifact("MockUSDC");
  const token = await new ethers.ContractFactory(mock.abi, mock.bytecode, owner).deploy();
  await token.waitForDeployment();
  tokenAddress = await token.getAddress();
  await (await token.mint(await owner.getAddress(), 1000n * 1_000_000n)).wait();
}
const usdc = new ethers.Contract(tokenAddress, ["function decimals() view returns(uint8)"], provider);
if (await usdc.decimals() !== 6n) throw new Error("USDC contract validation failed.");
const vaultArtifact = artifact("AgentCapsVault");
const vault = await new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, owner).deploy(tokenAddress);
await vault.waitForDeployment();
const vaultAddress = await vault.getAddress();
const receipt = await vault.deploymentTransaction().wait();
fs.mkdirSync("deployments", { recursive: true });
fs.writeFileSync(`deployments/${mode}.json`, JSON.stringify({ chainId: Number(chainId), vault: vaultAddress, usdc: tokenAddress, agent: agent.address, merchant, deploymentBlock: receipt.blockNumber, transactionHash: receipt.hash, deployedAt: new Date().toISOString() }, null, 2));
const envValues = {
  NEXT_PUBLIC_CHAIN_ID: String(chainId), NEXT_PUBLIC_VAULT_ADDRESS: vaultAddress,
  NEXT_PUBLIC_USDC_ADDRESS: tokenAddress, NEXT_PUBLIC_AGENT_ADDRESS: agent.address,
  NEXT_PUBLIC_MERCHANT_ADDRESS: merchant, NEXT_PUBLIC_DEPLOYMENT_BLOCK: String(receipt.blockNumber),
  NEXT_PUBLIC_RPC_URL: isLocal ? rpc : "https://sepolia.base.org",
  AGENTCAPS_LOCAL_DEMO: String(isLocal), BASE_SEPOLIA_RPC_URL: rpc, AGENT_PRIVATE_KEY: agent.privateKey,
  ...(isLocal ? { LOCAL_OWNER_PRIVATE_KEY: localWallet(0).privateKey } : {})
};
let existing = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
for (const [key, value] of Object.entries(envValues)) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  existing = regex.test(existing) ? existing.replace(regex, line) : `${existing.trimEnd()}\n${line}\n`;
}
if (!isLocal) existing = existing.replace(/^LOCAL_OWNER_PRIVATE_KEY=.*\n?/m, "");
fs.writeFileSync(".env.local", existing.trimStart());
if (isLocal) {
  const token = new ethers.Contract(tokenAddress, artifact("MockUSDC").abi, owner);
  await (await token.approve(vaultAddress, 10n * 1_000_000n)).wait();
  const block = await provider.getBlock("latest");
  await (await vault.createTask("Base token research", agent.address, 10n * 1_000_000n, block.timestamp + 86400, [merchant])).wait();
}
console.log(JSON.stringify({ network: isLocal ? "Local development" : "Base Sepolia", vault: vaultAddress, usdc: tokenAddress, agent: agent.address, merchant, environmentUpdated: ".env.local" }, null, 2));
