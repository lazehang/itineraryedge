import type { TravelItinerary } from "@itineraryedge/shared";

export type ItineraryGenerationContext = {
  destinationCountry: string;
  originCountry: string;
  startDate: string;
  endDate: string;
  travelerName: string;
  /** Free-text plan from prompt-first create; optional. */
  userPlanPrompt?: string;
};

export function buildGenerationContext(
  payload: TravelItinerary,
  destinationCountry: string,
  options?: { userPlanPrompt?: string },
): ItineraryGenerationContext | null {
  const stay = payload.segments?.find((segment) => segment.kind === "stay");
  if (!stay?.startDate || !stay.endDate) {
    return null;
  }

  const userPlanPrompt = options?.userPlanPrompt?.trim();

  return {
    destinationCountry,
    originCountry: payload.traveler.passportCountry ?? destinationCountry,
    startDate: stay.startDate,
    endDate: stay.endDate,
    travelerName: payload.traveler.displayName,
    ...(userPlanPrompt ? { userPlanPrompt } : {}),
  };
}
