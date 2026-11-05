import {
  GENERATION_SCHEMA_VERSION,
  type GenerationBundle,
  type GenerationSightseeingTimeline,
  type SightseeingDay,
} from "@itineraryedge/shared";
import type { ItineraryGenerationContext } from "../context.js";
import type { GenerationDriver } from "./types.js";

/** Illustrative major airport for ISO country (sample schedules only). */
const COUNTRY_AIRPORT: Record<string, { iata: string; city: string }> = {
  US: { iata: "JFK", city: "New York" },
  GB: { iata: "LHR", city: "London" },
  JP: { iata: "NRT", city: "Tokyo" },
  FR: { iata: "CDG", city: "Paris" },
  DE: { iata: "FRA", city: "Frankfurt" },
  IT: { iata: "FCO", city: "Rome" },
  ES: { iata: "MAD", city: "Madrid" },
  KR: { iata: "ICN", city: "Seoul" },
  CN: { iata: "PEK", city: "Beijing" },
  AU: { iata: "SYD", city: "Sydney" },
  CA: { iata: "YYZ", city: "Toronto" },
  SG: { iata: "SIN", city: "Singapore" },
  TH: { iata: "BKK", city: "Bangkok" },
  AE: { iata: "DXB", city: "Dubai" },
  IN: { iata: "DEL", city: "New Delhi" },
  BR: { iata: "GRU", city: "Sao Paulo" },
  MX: { iata: "MEX", city: "Mexico City" },
  NL: { iata: "AMS", city: "Amsterdam" },
  CH: { iata: "ZRH", city: "Zurich" },
  TW: { iata: "TPE", city: "Taipei" },
};

function airportForCountry(code: string): { iata: string; city: string } {
  return COUNTRY_AIRPORT[code.toUpperCase()] ?? {
    iata: "XXX",
    city: code.toUpperCase(),
  };
}

function mockBookingRef(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let ref = "";
  for (let i = 0; i < 6; i += 1) {
    ref += alphabet[(hash + i * 17) % alphabet.length];
    hash = (hash * 13 + 7) >>> 0;
  }
  return ref;
}

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

  const originAirport = airportForCountry(context.originCountry);
  const destAirport = airportForCountry(context.destinationCountry);
  const bookingRef = mockBookingRef(
    `${context.travelerName}:${context.startDate}:${context.destinationCountry}`,
  );

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
          carrier: "Sample Carrier",
          flightNumber: "SC401",
          origin: originAirport.city,
          destination: destAirport.city,
          originAirport: originAirport.iata,
          destinationAirport: destAirport.iata,
          bookingRef,
          cabinClass: "Economy",
          seat: "14A",
          terminal: "1",
          departDate: context.startDate,
          departTime: "08:30",
          arriveDate: context.startDate,
          arriveTime: "14:00",
        },
        {
          direction: "return",
          carrier: "Sample Carrier",
          flightNumber: "SC402",
          origin: destAirport.city,
          destination: originAirport.city,
          originAirport: destAirport.iata,
          destinationAirport: originAirport.iata,
          bookingRef,
          cabinClass: "Economy",
          seat: "22C",
          terminal: "2",
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
          city: destAirport.city,
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
