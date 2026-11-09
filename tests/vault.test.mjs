import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import hre from "hardhat";
const { ethers } = hre;
const U = 1_000_000n;
const artifact = name => JSON.parse(fs.readFileSync(`artifacts/contracts/${name}.json`, "utf8"));
// Decode the actual revert bytes: local solc artifacts do not include Hardhat's debug error names.
const vaultInterface = new ethers.Interface(artifact("AgentCapsVault").abi);
const revertedWith = name => error => {
  const data = typeof error.data === "string" ? error.data : error.message?.match(/return data: (0x[0-9a-f]+)/i)?.[1];
  try { return vaultInterface.parseError(data)?.name === name; } catch { return false; }
};
async function fixture() {
  const [owner, agent, merchant, stranger] = await ethers.getSigners();
  const token = await new ethers.ContractFactory(artifact("MockUSDC").abi, artifact("MockUSDC").bytecode, owner).deploy();
  const vault = await new ethers.ContractFactory(artifact("AgentCapsVault").abi, artifact("AgentCapsVault").bytecode, owner).deploy(await token.getAddress());
  await token.mint(owner.address, 100n * U);
  await token.approve(await vault.getAddress(), 100n * U);
  const latest = await ethers.provider.getBlock("latest");
  const expiry = latest.timestamp + 3600;
  await vault.createTask("Base token research", agent.address, 10n * U, expiry, [merchant.address]);
  return { owner, agent, merchant, stranger, token, vault, expiry };
}
test("an authorized payment reaches the merchant and updates only its task", async () => {
  const { owner, agent, merchant, token, vault, expiry } = await fixture();
  await vault.createTask("Second task", agent.address, 25n * U, expiry, [merchant.address]);
  const tx = await vault.connect(agent).pay(1, merchant.address, 2n * U, ethers.id("receipt-1"));
  const receipt = await tx.wait();
  assert.equal(await token.balanceOf(merchant.address), 2n * U);
  assert.equal((await vault.getTask(1)).spent, 2n * U);
  assert.equal((await vault.getTask(2)).spent, 0n);
  assert.equal(await vault.totalAllocated(), 33n * U);
  assert.equal(await token.balanceOf(await vault.getAddress()), 33n * U);
  assert.deepEqual(Array.from(await vault.getOwnerTaskIds(owner.address)), [1n, 2n]);
  assert.ok(receipt.logs.some(log => { try { return vault.interface.parseLog(log)?.name === "PaymentMade"; } catch { return false; } }));
});
test("overspending is rejected after a successful payment", async () => {
  const { agent, merchant, token, vault } = await fixture();
  await vault.connect(agent).pay(1, merchant.address, 2n * U, ethers.id("first"));
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, 9n * U, ethers.id("second")), revertedWith("BudgetExceeded"));
  assert.equal((await vault.getTask(1)).spent, 2n * U);
  assert.equal(await token.balanceOf(merchant.address), 2n * U);
});
test("the allocation of another task cannot cover an overspend", async () => {
  const { agent, merchant, vault, expiry } = await fixture();
  await vault.createTask("Other budget", agent.address, 20n * U, expiry, [merchant.address]);
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, 11n * U, ethers.id("cross-task")), revertedWith("BudgetExceeded"));
});
test("unknown recipients and unauthorized signers are rejected", async () => {
  const { agent, merchant, stranger, vault } = await fixture();
  await assert.rejects(vault.connect(agent).pay(1, stranger.address, U, ethers.id("wrong-recipient")), revertedWith("RecipientNotApproved"));
  await assert.rejects(vault.connect(stranger).pay(1, merchant.address, U, ethers.id("wrong-agent")), revertedWith("Unauthorized"));
});
test("payment IDs prevent duplicate execution", async () => {
  const { agent, merchant, vault } = await fixture();
  const payment = ethers.id("same-request");
  await vault.connect(agent).pay(1, merchant.address, U, payment);
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, U, payment), revertedWith("DuplicatePayment"));
  assert.equal((await vault.getTask(1)).spent, U);
});
test("expiry rejects spending at the exact boundary and permits recovery", async () => {
  const { agent, merchant, owner, vault, token, expiry } = await fixture();
  await ethers.provider.send("evm_setNextBlockTimestamp", [expiry]);
  await ethers.provider.send("evm_mine", []);
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, U, ethers.id("expired")), revertedWith("AccessExpired"));
  await vault.withdraw(1);
  assert.equal(await token.balanceOf(owner.address), 100n * U);
});
test("revocation stops spending and unused funds return to the owner", async () => {
  const { agent, merchant, owner, token, vault } = await fixture();
  await vault.connect(agent).pay(1, merchant.address, 2n * U, ethers.id("paid"));
  await vault.revoke(1);
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, U, ethers.id("revoked")), revertedWith("AccessRevoked"));
  await vault.withdraw(1);
  assert.equal(await token.balanceOf(owner.address), 98n * U);
  assert.equal((await vault.getTask(1)).withdrawn, 8n * U);
  assert.equal(await vault.totalAllocated(), 0n);
  await assert.rejects(vault.withdraw(1), revertedWith("NothingToWithdraw"));
});
test("only the owner can revoke or recover; active funds remain allocated", async () => {
  const { stranger, vault } = await fixture();
  await assert.rejects(vault.connect(stranger).revoke(1), revertedWith("Unauthorized"));
  await assert.rejects(vault.connect(stranger).withdraw(1), revertedWith("Unauthorized"));
  await assert.rejects(vault.withdraw(1), revertedWith("TaskStillActive"));
  await vault.revoke(1);
  await assert.rejects(vault.revoke(1), revertedWith("AccessRevoked"));
});
test("spending the exact remainder succeeds; exhausted budgets reject further spend", async () => {
  const { agent, merchant, vault } = await fixture();
  await vault.connect(agent).pay(1, merchant.address, 10n * U, ethers.id("exact"));
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, 1n, ethers.id("extra")), revertedWith("BudgetExceeded"));
});
test("zero amounts and empty payment identifiers are rejected", async () => {
  const { agent, merchant, vault } = await fixture();
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, 0, ethers.id("zero")), revertedWith("InvalidAmount"));
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, U, ethers.ZeroHash), revertedWith("InvalidAmount"));
});
test("failed token transfers roll back spent balance and payment IDs", async () => {
  const { agent, merchant, token, vault } = await fixture();
  const payment = ethers.id("retryable");
  await token.setTransfersBlocked(true);
  await assert.rejects(vault.connect(agent).pay(1, merchant.address, U, payment), /TransfersBlocked/);
  assert.equal((await vault.getTask(1)).spent, 0n);
  assert.equal(await vault.usedPaymentId(1, payment), false);
  assert.equal(await vault.totalAllocated(), 10n * U);
  await token.setTransfersBlocked(false);
  await vault.connect(agent).pay(1, merchant.address, U, payment);
});
test("failed withdrawals preserve recoverable funds", async () => {
  const { token, vault } = await fixture();
  await vault.revoke(1);
  await token.setTransfersBlocked(true);
  await assert.rejects(vault.withdraw(1), /TransfersBlocked/);
  assert.equal((await vault.getTask(1)).withdrawn, 0n);
  await token.setTransfersBlocked(false);
  await vault.withdraw(1);
});
test("funding validates recipient rules, agent, amount, name, and expiry", async () => {
  const { agent, merchant, vault, expiry } = await fixture();
  await assert.rejects(vault.createTask("", agent.address, U, expiry, [merchant.address]), revertedWith("InvalidTask"));
  await assert.rejects(vault.createTask("Bad", ethers.ZeroAddress, U, expiry, [merchant.address]), revertedWith("InvalidTask"));
  await assert.rejects(vault.createTask("Bad", agent.address, 0, expiry, [merchant.address]), revertedWith("InvalidAmount"));
  await assert.rejects(vault.createTask("Bad", agent.address, U, 1, [merchant.address]), revertedWith("InvalidExpiry"));
  await assert.rejects(vault.createTask("Bad", agent.address, U, expiry, [ethers.ZeroAddress]), revertedWith("InvalidRecipient"));
  await assert.rejects(vault.createTask("Bad", agent.address, U, expiry, [merchant.address, merchant.address]), revertedWith("InvalidRecipient"));
  await assert.rejects(vault.createTask("Bad", agent.address, U, expiry, []), revertedWith("InvalidTask"));
  await assert.rejects(vault.getTask(999), revertedWith("TaskNotFound"));
});
