import {
  GENERATION_SCHEMA_VERSION,
  type GenerationBundle,
  type GenerationSightseeingTimeline,
  type SightseeingDay,
} from "@itineraryedge/shared";
import type { ItineraryGenerationContext } from "../context.js";
import type { GenerationDriver } from "./types.js";

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function buildSightseeingDays(context: ItineraryGenerationContext): SightseeingDay[] {
  const dates = enumerateDates(context.startDate, context.endDate);
  const themes = ["Arrival & orientation", "Culture", "Food & neighborhoods", "Nature day", "Farewell"];

  return dates.map((date, index) => {
    const isFirst = index === 0;
    const isLast = index === dates.length - 1;

    if (isFirst) {
      return {
        date,
        theme: themes[0] ?? "Arrival",
        items: [
          {
            startTime: "16:00",
            endTime: "17:30",
            title: "Neighborhood walk",
            place: `${context.destinationCountry} city center`,
            category: "culture" as const,
          },
          {
            startTime: "19:00",
            endTime: "20:30",
            title: "Welcome dinner",
            place: "Local restaurant district",
            category: "food" as const,
          },
        ],
      };
    }

    if (isLast) {
      return {
        date,
        theme: "Departure prep",
        items: [
          {
            startTime: "09:00",
            endTime: "11:00",
            title: "Souvenir stop",
            place: "Market arcade",
            category: "culture" as const,
          },
          {
            startTime: "12:00",
            endTime: "13:00",
            title: "Transfer buffer",
            place: "Hotel lobby",
            category: "transit" as const,
          },
        ],
      };
    }

    const theme = themes[(index % themes.length) + 1] ?? "Exploration";
    return {
      date,
      theme,
      items: [
        {
          startTime: "09:30",
          endTime: "12:00",
          title: `${theme} highlight`,
          place: `Landmark ${index}`,
          category: "culture" as const,
        },
        {
          startTime: "13:30",
          endTime: "15:30",
          title: "Local tasting",
          place: "Central district",
          category: "food" as const,
        },
        {
          startTime: "17:00",
          endTime: "18:00",
          title: "Rest break",
          place: "Hotel",
          category: "rest" as const,
        },
      ],
    };
  });
}

export function buildMockGenerationBundle(
  context: ItineraryGenerationContext,
): GenerationBundle {
  const sightseeingTimeline: GenerationSightseeingTimeline = {
    schemaVersion: GENERATION_SCHEMA_VERSION,
    days: buildSightseeingDays(context),
  };

  return {
    searchParams: {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      destinationCountry: context.destinationCountry,
      originCountry: context.originCountry,
      startDate: context.startDate,
      endDate: context.endDate,
      travelerName: context.travelerName,
      focusAreas: ["embassy-style schedule", "landmarks", "transit realism"],
    },
    flightSchedule: {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      segments: [
        {
          direction: "outbound",
          carrier: "OpenSkies",
          flightNumber: "OS401",
          origin: context.originCountry,
          destination: context.destinationCountry,
          departDate: context.startDate,
          departTime: "08:30",
          arriveDate: context.startDate,
          arriveTime: "14:00",
        },
        {
          direction: "return",
          carrier: "OpenSkies",
          flightNumber: "OS402",
          origin: context.destinationCountry,
          destination: context.originCountry,
          departDate: context.endDate,
          departTime: "17:00",
          arriveDate: context.endDate,
          arriveTime: "22:30",
        },
      ],
    },
    hotelInventory: {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      hotels: [
        {
          name: "Edge Harbor Hotel",
          city: context.destinationCountry,
          checkIn: context.startDate,
          checkOut: context.endDate,
          starRating: 4,
          nightlyRateUsd: 165,
        },
      ],
    },
    sightseeingTimeline,
  };
}

export const mockGenerationDriver: GenerationDriver = {
  name: "mock",
  async generate(context) {
    return buildMockGenerationBundle(context);
  },
};
