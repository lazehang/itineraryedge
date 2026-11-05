import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePlanHints, validatePlanItineraryInput } from "@itineraryedge/shared";
import { extractPlanFieldsHeuristic } from "../generation/plan-extract.js";

describe("plan route field resolution", () => {
  it("rejects ambiguous prompts that lack passport nationality", () => {
    const validated = validatePlanItineraryInput({
      email: "traveler@example.com",
      prompt: "Trip to Japan from 2026-06-01 to 2026-06-08 for museums and food",
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) {
      return;
    }

    const extracted = extractPlanFieldsHeuristic(validated.value.prompt);
    const merged = mergePlanHints(validated.value, extracted);
    assert.equal(merged.ok, false);
    if (merged.ok) {
      return;
    }
    assert.ok(merged.errors.passportNationality);
  });

  it("accepts a complete prompt via heuristic extract", () => {
    const validated = validatePlanItineraryInput({
      email: "traveler@example.com",
      prompt:
        "I am Alex Traveler visiting Japan from 2026-06-01 to 2026-06-08 with a US passport",
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) {
      return;
    }
    const extracted = extractPlanFieldsHeuristic(validated.value.prompt);
    const merged = mergePlanHints(validated.value, extracted);
    assert.equal(merged.ok, true);
    if (!merged.ok) {
      return;
    }
    assert.equal(merged.value.destinationCountry, "JP");
    assert.equal(merged.value.passportNationality, "US");
  });
});
