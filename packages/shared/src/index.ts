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

export {
  GENERATION_SCHEMA_VERSION,
  type FlightSegment,
  type GenerationBundle,
  type GenerationFlightSchedule,
  type GenerationHotelInventory,
  type GenerationSearchParams,
  type GenerationSightseeingTimeline,
  type GenerateErrorCode,
  type HotelEntry,
  type SightseeingDay,
  type SightseeingItem,
} from "./generation-types";

export {
  validateFlightSchedule,
  validateGenerationBundle,
  validateHotelInventory,
  validateSearchParams,
  validateSightseeingTimeline,
} from "./generation-validation";

export {
  assertSightseeingTimelineFeasible,
  assertTripSpanAllowsGeneration,
  runSameDayGuards,
  type SameDayGuardResult,
} from "./same-day-guard";

export {
  formatUnlockPriceLine,
  resolveGeoPricingDisplay,
  type GeoPricingCurrency,
  type GeoPricingDisplay,
} from "./geo-pricing";

export {
  premiumUnlockBadgeLabel,
  TRAVEL_PACKET_COPY,
  type PremiumUnlockBadgeKind,
} from "./travel-packet-copy";
