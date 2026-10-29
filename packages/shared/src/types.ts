/** Shared itinerary domain types (aligned with schema/itinerary.schema.json v1). */

export const ITINERARY_SCHEMA_VERSION = "1.0" as const;

export const ITINERARY_DISCLAIMER =
  "Supporting travel schedule packet only — not a visa, approval, or guarantee of entry." as const;

export type SegmentKind = "flight" | "stay" | "transfer" | "activity";

export interface ItinerarySegment {
  kind: SegmentKind;
  label: string;
  location?: string;
  startDate: string;
  endDate: string;
  confirmationRef?: string;
}

export interface ItineraryTraveler {
  displayName: string;
  passportCountry?: string;
}

export interface TravelItinerary {
  schemaVersion: typeof ITINERARY_SCHEMA_VERSION;
  title: string;
  traveler: ItineraryTraveler;
  segments: ItinerarySegment[];
  embassyNotes?: string[];
  disclaimer: typeof ITINERARY_DISCLAIMER;
}
