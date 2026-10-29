import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatUnlockPriceLine, resolveGeoPricingDisplay } from "./geo-pricing.js";

describe("resolveGeoPricingDisplay", () => {
  it("maps Hong Kong to HKD 70", () => {
    assert.deepEqual(resolveGeoPricingDisplay("HK"), {
      currency: "HKD",
      amountMajor: 70,
      displayAmount: "HK$70",
    });
    assert.deepEqual(resolveGeoPricingDisplay("HKG"), {
      currency: "HKD",
      amountMajor: 70,
      displayAmount: "HK$70",
    });
  });

  it("maps eurozone countries to EUR 9", () => {
    assert.equal(resolveGeoPricingDisplay("DE")?.displayAmount, "€9");
    assert.equal(resolveGeoPricingDisplay("fr")?.currency, "EUR");
    assert.equal(resolveGeoPricingDisplay("IE")?.amountMajor, 9);
  });

  it("maps other countries to USD 9", () => {
    assert.deepEqual(resolveGeoPricingDisplay("US"), {
      currency: "USD",
      amountMajor: 9,
      displayAmount: "$9 USD",
    });
    assert.deepEqual(resolveGeoPricingDisplay("JP"), {
      currency: "USD",
      amountMajor: 9,
      displayAmount: "$9 USD",
    });
  });

  it("returns null when country is missing", () => {
    assert.equal(resolveGeoPricingDisplay(null), null);
    assert.equal(resolveGeoPricingDisplay(""), null);
  });
});

describe("formatUnlockPriceLine", () => {
  it("includes geo amount or checkout fallback", () => {
    assert.equal(formatUnlockPriceLine("HK"), "Unlock polished PDF · HK$70");
    assert.equal(
      formatUnlockPriceLine(undefined),
      "Unlock polished PDF · Price shown at checkout",
    );
  });
});
