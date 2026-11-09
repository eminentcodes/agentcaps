import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyMessage } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { authorizationMessage, validAuthorizationTime } from "../src/lib/authorization.mjs";
const input = { chainId: 84532, vault: "0x1111111111111111111111111111111111111111", taskId: "1", recipient: "0x3333333333333333333333333333333333333333", amount: "2370000", requestId: "9c16d8ba-cd0e-42c7-b7d5-3c86a3ae4321", expiresAt: 1000 };
test("owner signatures bind every spending request field", async () => {
  const owner = privateKeyToAccount(generatePrivateKey());
  const stranger = privateKeyToAccount(generatePrivateKey());
  const signature = await owner.signMessage({ message: authorizationMessage(input) });
  assert.equal(await verifyMessage({ address: owner.address, message: authorizationMessage(input), signature }), true);
  assert.equal(await verifyMessage({ address: stranger.address, message: authorizationMessage(input), signature }), false);
  for (const mutation of [{ chainId: 31337 }, { vault: "0x2222222222222222222222222222222222222222" }, { taskId: "2" }, { recipient: "0x4444444444444444444444444444444444444444" }, { amount: "2380000" }, { requestId: "different" }, { expiresAt: 1001 }]) {
    assert.equal(await verifyMessage({ address: owner.address, message: authorizationMessage({ ...input, ...mutation }), signature }), false);
  }
});
test("authorization windows reject expired and excessively long grants", () => {
  assert.equal(validAuthorizationTime(1001, 1000), true);
  assert.equal(validAuthorizationTime(1300, 1000), true);
  assert.equal(validAuthorizationTime(1000, 1000), false);
  assert.equal(validAuthorizationTime(999, 1000), false);
  assert.equal(validAuthorizationTime(1301, 1000), false);
  assert.equal(validAuthorizationTime(1001.1, 1000), false);
});
