import { createPublicClient, defineChain, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chain = defineChain({ id: 84532, name: "Base Sepolia", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"] } }, testnet: true });
const client = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0], { timeout: 15000, retryCount: 1 }) });
if (await client.getChainId() !== 84532) throw new Error("Expected Base Sepolia.");
const addresses = { deployer: privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY).address, agent: privateKeyToAccount(process.env.AGENT_PRIVATE_KEY).address };
const result = await Promise.all(Object.entries(addresses).map(async ([role, address]) => ({ role, address, testETH: formatEther(await client.getBalance({ address })) })));
console.log(JSON.stringify({ network: "Base Sepolia", wallets: result }, null, 2));
