/** Strict JSON shapes for open-mode generation (Iteration 3). */

export const GENERATION_SCHEMA_VERSION = "1.0" as const;

export type GenerationSearchParams = {
  schemaVersion: typeof GENERATION_SCHEMA_VERSION;
  destinationCountry: string;
  originCountry: string;
  startDate: string;
  endDate: string;
  travelerName: string;
  focusAreas: string[];
};

export type FlightSegment = {
  direction: "outbound" | "return";
  carrier: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
};

export type GenerationFlightSchedule = {
  schemaVersion: typeof GENERATION_SCHEMA_VERSION;
  segments: FlightSegment[];
};

export type HotelEntry = {
  name: string;
  city: string;
  checkIn: string;
  checkOut: string;
  starRating: number;
  nightlyRateUsd: number;
};

export type GenerationHotelInventory = {
  schemaVersion: typeof GENERATION_SCHEMA_VERSION;
  hotels: HotelEntry[];
};

export type SightseeingItem = {
  startTime: string;
  endTime: string;
  title: string;
  place: string;
  category: "culture" | "food" | "nature" | "transit" | "rest";
};

export type SightseeingDay = {
  date: string;
  theme: string;
  items: SightseeingItem[];
};

export type GenerationSightseeingTimeline = {
  schemaVersion: typeof GENERATION_SCHEMA_VERSION;
  days: SightseeingDay[];
};

export type GenerationBundle = {
  searchParams: GenerationSearchParams;
  flightSchedule: GenerationFlightSchedule;
  hotelInventory: GenerationHotelInventory;
  sightseeingTimeline: GenerationSightseeingTimeline;
};

export type GenerateErrorCode = "VALIDATION" | "SAME_DAY" | "BYOK";
