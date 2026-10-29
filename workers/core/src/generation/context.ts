import type { TravelItinerary } from "@itineraryedge/shared";

export type ItineraryGenerationContext = {
  destinationCountry: string;
  originCountry: string;
  startDate: string;
  endDate: string;
  travelerName: string;
};

export function buildGenerationContext(
  payload: TravelItinerary,
  destinationCountry: string,
): ItineraryGenerationContext | null {
  const stay = payload.segments?.find((segment) => segment.kind === "stay");
  if (!stay?.startDate || !stay.endDate) {
    return null;
  }

  return {
    destinationCountry,
    originCountry: payload.traveler.passportCountry ?? destinationCountry,
    startDate: stay.startDate,
    endDate: stay.endDate,
    travelerName: payload.traveler.displayName,
  };
}
