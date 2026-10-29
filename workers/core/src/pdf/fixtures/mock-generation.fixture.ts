import {
  GENERATION_SCHEMA_VERSION,
  type GenerationFlightSchedule,
  type GenerationHotelInventory,
  type GenerationSightseeingTimeline,
  type TravelItinerary,
} from "@itineraryedge/shared";

export const mockStandardPdfInput = {
  itineraryId: "11111111-1111-4111-8111-111111111111",
  title: "Japan — 2026-04-01",
  destinationCountry: "JP",
  profileEmail: "traveler@example.com",
  profileDisplayName: "Alex Traveler",
  payload: {
    schemaVersion: "1.0",
    title: "Japan — 2026-04-01",
    traveler: { displayName: "Alex Traveler", passportCountry: "US" },
    segments: [
      {
        kind: "stay",
        label: "Tokyo stay",
        location: "JP",
        startDate: "2026-04-01",
        endDate: "2026-04-05",
      },
    ],
    disclaimer:
      "Supporting travel schedule packet only — not a visa, approval, or guarantee of entry.",
  } satisfies TravelItinerary,
  flightSchedule: {
    schemaVersion: GENERATION_SCHEMA_VERSION,
    segments: [
      {
        direction: "outbound",
        carrier: "OpenSkies",
        flightNumber: "OS401",
        origin: "US",
        destination: "JP",
        departDate: "2026-04-01",
        departTime: "08:30",
        arriveDate: "2026-04-01",
        arriveTime: "14:00",
      },
    ],
  } satisfies GenerationFlightSchedule,
  hotelInventory: {
    schemaVersion: GENERATION_SCHEMA_VERSION,
    hotels: [
      {
        name: "Edge Harbor Hotel",
        city: "JP",
        checkIn: "2026-04-01",
        checkOut: "2026-04-05",
        starRating: 4,
        nightlyRateUsd: 165,
      },
    ],
  } satisfies GenerationHotelInventory,
  sightseeingTimeline: {
    schemaVersion: GENERATION_SCHEMA_VERSION,
    days: [
      {
        date: "2026-04-01",
        theme: "Arrival",
        items: [
          {
            startTime: "16:00",
            endTime: "17:30",
            title: "Neighborhood walk",
            place: "Shibuya",
            category: "culture",
          },
        ],
      },
    ],
  } satisfies GenerationSightseeingTimeline,
};
