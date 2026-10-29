import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ITINERARY_DISCLAIMER,
  ITINERARY_SCHEMA_VERSION,
  type GenerationBundle,
  type TravelItinerary,
} from "@itineraryedge/shared";
import type { GenerationDriver } from "./drivers/types.js";
import { runItineraryGeneration } from "./run-generation.js";

function sameDayPayload(): TravelItinerary {
  return {
    schemaVersion: ITINERARY_SCHEMA_VERSION,
    title: "Same-day trip",
    traveler: { displayName: "Alex Traveler", passportCountry: "US" },
    segments: [
      {
        kind: "stay",
        label: "Tokyo",
        location: "JP",
        startDate: "2026-06-01",
        endDate: "2026-06-01",
      },
    ],
    disclaimer: ITINERARY_DISCLAIMER,
  };
}

describe("runItineraryGeneration pre-AI SAME_DAY guard", () => {
  it("does not invoke the driver when trip span is same-day", async () => {
    let generateCalls = 0;
    const spyDriver: GenerationDriver = {
      name: "spy",
      async generate(): Promise<GenerationBundle> {
        generateCalls += 1;
        throw new Error("driver should not be called");
      },
    };

    const result = await runItineraryGeneration({
      payload: sameDayPayload(),
      destinationCountry: "JP",
      driver: spyDriver,
    });

    assert.equal(generateCalls, 0);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.equal(result.code, "SAME_DAY");
  });
});
