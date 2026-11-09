import fs from "node:fs";
import path from "node:path";
import solc from "solc";
const names = ["AgentCapsVault", "MockUSDC"];
const input = { language: "Solidity", sources: Object.fromEntries(names.map(name => [`${name}.sol`, { content: fs.readFileSync(`contracts/${name}.sol`, "utf8") }])), settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris", outputSelection: { "*": { "*": ["abi", "evm.bytecode", "metadata"] } } } };
const result = JSON.parse(solc.compile(JSON.stringify(input), { import: name => { try { return { contents: fs.readFileSync(path.join("node_modules", name), "utf8") }; } catch { return { error: `Missing import: ${name}` }; } } }));
for (const issue of result.errors ?? []) { if (issue.severity === "error") { process.stderr.write(issue.formattedMessage); process.exitCode = 1; } }
if (process.exitCode) process.exit();
fs.mkdirSync("artifacts/contracts", { recursive: true });
for (const name of names) { const contract = result.contracts[`${name}.sol`][name]; fs.writeFileSync(`artifacts/contracts/${name}.json`, JSON.stringify({ abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}`, metadata: JSON.parse(contract.metadata) }, null, 2)); }
console.log(`Compiled ${names.join(", ")} with solc ${solc.version()}`);
