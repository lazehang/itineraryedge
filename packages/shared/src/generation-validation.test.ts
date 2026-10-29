import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GENERATION_SCHEMA_VERSION } from "./generation-types";
import {
  validateFlightSchedule,
  validateGenerationBundle,
  validateHotelInventory,
  validateSearchParams,
  validateSightseeingTimeline,
} from "./generation-validation";

const validSearchParams = {
  schemaVersion: GENERATION_SCHEMA_VERSION,
  destinationCountry: "JP",
  originCountry: "US",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  travelerName: "Alex Traveler",
  focusAreas: ["culture"],
};

const validSightseeing = {
  schemaVersion: GENERATION_SCHEMA_VERSION,
  days: [
    {
      date: "2026-06-02",
      theme: "Highlights",
      items: [
        {
          startTime: "10:00",
          endTime: "12:00",
          title: "Museum",
          place: "Downtown",
          category: "culture",
        },
      ],
    },
  ],
};

const validFlights = {
  schemaVersion: GENERATION_SCHEMA_VERSION,
  segments: [
    {
      direction: "outbound",
      carrier: "OpenSkies",
      flightNumber: "OS401",
      origin: "US",
      destination: "JP",
      departDate: "2026-06-01",
      departTime: "08:30",
      arriveDate: "2026-06-01",
      arriveTime: "14:00",
    },
    {
      direction: "return",
      carrier: "OpenSkies",
      flightNumber: "OS402",
      origin: "JP",
      destination: "US",
      departDate: "2026-06-05",
      departTime: "17:00",
      arriveDate: "2026-06-05",
      arriveTime: "22:30",
    },
  ],
};

const validHotels = {
  schemaVersion: GENERATION_SCHEMA_VERSION,
  hotels: [
    {
      name: "Edge Harbor Hotel",
      city: "Tokyo",
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      starRating: 4,
      nightlyRateUsd: 165,
    },
  ],
};

describe("validateGenerationBundle", () => {
  it("accepts a coherent bundle", () => {
    const result = validateGenerationBundle({
      searchParams: validSearchParams,
      flightSchedule: validFlights,
      hotelInventory: validHotels,
      sightseeingTimeline: validSightseeing,
    });
    assert.equal(result.ok, true);
  });

  it("rejects invalid search params country codes", () => {
    const result = validateSearchParams({
      ...validSearchParams,
      destinationCountry: "Japan",
    });
    assert.equal(result.ok, false);
  });

  it("rejects sightseeing items where endTime is not after startTime", () => {
    const result = validateSightseeingTimeline({
      schemaVersion: GENERATION_SCHEMA_VERSION,
      days: [
        {
          date: "2026-06-02",
          theme: "Busy day",
          items: [
            {
              startTime: "12:00",
              endTime: "10:00",
              title: "A",
              place: "One",
              category: "culture",
            },
          ],
        },
      ],
    });
    assert.equal(result.ok, false);
  });

  it("rejects flight schedule missing return leg", () => {
    const result = validateFlightSchedule({
      schemaVersion: GENERATION_SCHEMA_VERSION,
      segments: [validFlights.segments[0]],
    });
    assert.equal(result.ok, false);
  });

  it("rejects hotel inventory without hotels", () => {
    const result = validateHotelInventory({
      schemaVersion: GENERATION_SCHEMA_VERSION,
      hotels: [],
    });
    assert.equal(result.ok, false);
  });

  it("rejects bundle when any artifact fails validation", () => {
    const result = validateGenerationBundle({
      searchParams: validSearchParams,
      flightSchedule: validFlights,
      hotelInventory: validHotels,
      sightseeingTimeline: { schemaVersion: "0.0", days: [] },
    });
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.ok(result.errors.some((err) => err.includes("schemaVersion")));
  });
});
