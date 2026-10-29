import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePdfVariant } from "./pdf-access.js";

describe("resolvePdfVariant", () => {
  it("uses polished path suffix", () => {
    assert.equal(
      resolvePdfVariant("/api/itineraries/abc/pdf/polished", null),
      "polished",
    );
  });

  it("uses variant query param", () => {
    assert.equal(
      resolvePdfVariant("/api/itineraries/abc/pdf", "polished"),
      "polished",
    );
    assert.equal(resolvePdfVariant("/api/itineraries/abc/pdf", "standard"), "standard");
    assert.equal(resolvePdfVariant("/api/itineraries/abc/pdf", null), "standard");
  });
});
