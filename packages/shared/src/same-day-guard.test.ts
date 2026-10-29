import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GENERATION_SCHEMA_VERSION } from "./generation-types";
import {
  assertSightseeingTimelineFeasible,
  assertTripSpanAllowsGeneration,
  runSameDayGuards,
} from "./same-day-guard";
import type { GenerationFlightSchedule, GenerationSightseeingTimeline } from "./generation-types";

const sampleTimeline = (overrides?: Partial<GenerationSightseeingTimeline>): GenerationSightseeingTimeline => ({
  schemaVersion: GENERATION_SCHEMA_VERSION,
  days: [
    {
      date: "2026-06-02",
      theme: "City highlights",
      items: [
        {
          startTime: "10:00",
          endTime: "12:00",
          title: "Museum",
          place: "Downtown",
          category: "culture",
        },
        {
          startTime: "13:00",
          endTime: "15:00",
          title: "Park",
          place: "Central",
          category: "nature",
        },
      ],
    },
  ],
  ...overrides,
});

describe("assertTripSpanAllowsGeneration", () => {
  it("rejects identical start and end dates", () => {
    const result = assertTripSpanAllowsGeneration("2026-06-01", "2026-06-01");
    assert.equal(result.ok, false);
  });

  it("allows multi-day spans", () => {
    const result = assertTripSpanAllowsGeneration("2026-06-01", "2026-06-05");
    assert.equal(result.ok, true);
  });
});

describe("assertSightseeingTimelineFeasible", () => {
  it("rejects overlapping activities on the same day", () => {
    const timeline = sampleTimeline({
      days: [
        {
          date: "2026-06-02",
          theme: "Packed",
          items: [
            {
              startTime: "09:00",
              endTime: "12:00",
              title: "A",
              place: "X",
              category: "culture",
            },
            {
              startTime: "11:00",
              endTime: "13:00",
              title: "B",
              place: "Y",
              category: "food",
            },
          ],
        },
      ],
    });

    const result = assertSightseeingTimelineFeasible(timeline);
    assert.equal(result.ok, false);
  });

  it("rejects activities before outbound arrival on arrival day", () => {
    const timeline = sampleTimeline({
      days: [
        {
          date: "2026-06-01",
          theme: "Arrival",
          items: [
            {
              startTime: "08:00",
              endTime: "09:00",
              title: "Early tour",
              place: "City",
              category: "culture",
            },
          ],
        },
      ],
    });

    const flights: GenerationFlightSchedule = {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      segments: [
        {
          direction: "outbound",
          carrier: "IE",
          flightNumber: "IE100",
          origin: "SFO",
          destination: "NRT",
          departDate: "2026-06-01",
          departTime: "06:00",
          arriveDate: "2026-06-01",
          arriveTime: "14:00",
        },
        {
          direction: "return",
          carrier: "IE",
          flightNumber: "IE101",
          origin: "NRT",
          destination: "SFO",
          departDate: "2026-06-07",
          departTime: "16:00",
          arriveDate: "2026-06-07",
          arriveTime: "10:00",
        },
      ],
    };

    const result = assertSightseeingTimelineFeasible(timeline, flights);
    assert.equal(result.ok, false);
  });
});

describe("runSameDayGuards", () => {
  it("combines span and timeline checks", () => {
    const badSpan = runSameDayGuards({
      startDate: "2026-06-01",
      endDate: "2026-06-01",
      sightseeingTimeline: sampleTimeline(),
    });
    assert.equal(badSpan.ok, false);

    const ok = runSameDayGuards({
      startDate: "2026-06-01",
      endDate: "2026-06-07",
      sightseeingTimeline: sampleTimeline(),
    });
    assert.equal(ok.ok, true);
  });
});
