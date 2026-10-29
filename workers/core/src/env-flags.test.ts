import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMockUnlockAllowed } from "./env-flags.js";

describe("isMockUnlockAllowed", () => {
  it("is off unless ALLOW_MOCK_UNLOCK is exactly 1", () => {
    assert.equal(isMockUnlockAllowed({}), false);
    assert.equal(isMockUnlockAllowed({ ALLOW_MOCK_UNLOCK: "0" }), false);
    assert.equal(isMockUnlockAllowed({ ALLOW_MOCK_UNLOCK: "true" }), false);
    assert.equal(isMockUnlockAllowed({ ALLOW_MOCK_UNLOCK: "1" }), true);
  });
});
