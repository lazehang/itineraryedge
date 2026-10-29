import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTravelItineraryPayload,
  validateCreateItineraryInput,
} from "./validation.js";
import { ITINERARY_DISCLAIMER } from "./types.js";

describe("validateCreateItineraryInput", () => {
  const valid = {
    email: "Traveler@Example.com",
    travelerName: "Alex Rivera",
    passportNationality: "us",
    destinationCountry: "jp",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
  };

  it("accepts valid input and normalizes email and country codes", () => {
    const result = validateCreateItineraryInput(valid);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.email, "traveler@example.com");
    assert.equal(result.value.passportNationality, "US");
    assert.equal(result.value.destinationCountry, "JP");
  });

  it("rejects end date before start date", () => {
    const result = validateCreateItineraryInput({
      ...valid,
      startDate: "2026-06-14",
      endDate: "2026-06-01",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.errors.endDate ?? "", /on or after/);
  });

  it("rejects invalid email", () => {
    const result = validateCreateItineraryInput({ ...valid, email: "not-an-email" });
    assert.equal(result.ok, false);
  });
});

describe("buildTravelItineraryPayload", () => {
  it("maps destination into stay segment location and sets disclaimer", () => {
    const payload = buildTravelItineraryPayload({
      email: "a@b.co",
      travelerName: "Sam",
      passportNationality: "GB",
      destinationCountry: "FR",
      startDate: "2026-01-01",
      endDate: "2026-01-07",
    });
    assert.equal(payload.disclaimer, ITINERARY_DISCLAIMER);
    assert.equal(payload.segments.length, 1);
    assert.equal(payload.segments[0]?.location, "FR");
    assert.equal(payload.segments[0]?.kind, "stay");
  });
});
