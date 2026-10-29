import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  premiumUnlockBadgeLabel,
  TRAVEL_PACKET_COPY,
} from "./travel-packet-copy.js";

describe("travel packet copy", () => {
  it("uses premium vs demo badge labels", () => {
    assert.equal(premiumUnlockBadgeLabel("premium"), TRAVEL_PACKET_COPY.badgePremiumUnlocked);
    assert.equal(premiumUnlockBadgeLabel("demo"), TRAVEL_PACKET_COPY.badgeDemoUnlocked);
  });

  it("keeps canonical pay and staging mock CTAs", () => {
    assert.equal(TRAVEL_PACKET_COPY.payToUnlock, "Pay to unlock");
    assert.equal(TRAVEL_PACKET_COPY.demoUnlockStaging, "Demo unlock (staging)");
  });
});
