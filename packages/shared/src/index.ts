export {
  ITINERARY_DISCLAIMER,
  ITINERARY_SCHEMA_VERSION,
  type ItinerarySegment,
  type ItineraryTraveler,
  type SegmentKind,
  type TravelItinerary,
} from "./types";

export {
  buildTravelItineraryPayload,
  defaultItineraryTitle,
  normalizeCountryCode,
  normalizeEmail,
  parseDestinationCountryFromPayload,
  validateCreateItineraryInput,
  type CreateItineraryInput,
  type FieldErrors,
} from "./validation";
