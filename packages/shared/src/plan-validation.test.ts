import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePlanHints, validatePlanItineraryInput } from "./plan-validation";

describe("validatePlanItineraryInput", () => {
  it("accepts email + prompt with optional hints", () => {
    const result = validatePlanItineraryInput({
      email: "Alex@Example.com",
      prompt: "Trip to Japan from 2026-06-01 to 2026-06-08 for culture.",
      destinationCountry: "jp",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.email, "alex@example.com");
    assert.equal(result.value.destinationCountry, "JP");
  });

  it("rejects short prompts", () => {
    const result = validatePlanItineraryInput({
      email: "a@b.co",
      prompt: "short",
    });
    assert.equal(result.ok, false);
  });
});

describe("mergePlanHints", () => {
  it("merges extracted fields into create input", () => {
    const result = mergePlanHints(
      {
        email: "a@b.co",
        prompt: "Visit Tokyo next summer",
      },
      {
        travelerName: "Alex Traveler",
        passportNationality: "US",
        destinationCountry: "JP",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      },
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.destinationCountry, "JP");
    assert.equal(result.value.travelerName, "Alex Traveler");
  });

  it("fails closed when passport nationality is missing", () => {
    const result = mergePlanHints(
      {
        email: "a@b.co",
        prompt: "Visit Tokyo 2026-06-01 to 2026-06-08",
      },
      {
        travelerName: "Alex",
        destinationCountry: "JP",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      },
    );
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.ok(result.errors.passportNationality);
  });
});
