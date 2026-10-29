import { jsonResponse } from "../cors.js";
import { getItineraryById, unlockMockPremium } from "../db/itineraries.js";
import type { Env } from "../index.js";

export async function handleUnlockMockRoute(
  request: Request,
  env: Env,
  itineraryId: string,
  profileId: string,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "Method not allowed." }, { status: 405 });
  }

  const existing = await getItineraryById(env.DB, itineraryId);
  if (!existing || existing.profileId !== profileId) {
    return jsonResponse(request, { error: "Itinerary not found." }, { status: 404 });
  }

  const alreadyUnlocked = existing.isPremiumUnlocked;
  const itinerary = await unlockMockPremium(env.DB, profileId, itineraryId);
  if (!itinerary) {
    return jsonResponse(request, { error: "Itinerary not found." }, { status: 404 });
  }

  return jsonResponse(request, {
    itinerary,
    unlock: { mock: true, alreadyUnlocked },
  });
}
