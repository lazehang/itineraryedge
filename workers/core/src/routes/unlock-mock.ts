import { jsonResponse } from "../cors.js";
import { getItineraryById, unlockMockPremium } from "../db/itineraries.js";
import { isMockUnlockAllowed } from "../env-flags.js";
import type { Env } from "../index.js";

export async function handleUnlockMockRoute(
  request: Request,
  env: Env,
  itineraryId: string,
  profileId: string,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(request, env, { error: "Method not allowed." }, { status: 405 });
  }

  if (!isMockUnlockAllowed(env)) {
    return jsonResponse(
      request,
      env,
      {
        error: "Mock unlock is disabled in this environment.",
        code: "MOCK_UNLOCK_DISABLED",
      },
      { status: 403 },
    );
  }

  const existing = await getItineraryById(env.DB, itineraryId);
  if (!existing || existing.profileId !== profileId) {
    return jsonResponse(request, env, { error: "Itinerary not found." }, { status: 404 });
  }

  const alreadyUnlocked = existing.isPremiumUnlocked;
  const itinerary = await unlockMockPremium(env.DB, profileId, itineraryId);
  if (!itinerary) {
    return jsonResponse(request, env, { error: "Itinerary not found." }, { status: 404 });
  }

  return jsonResponse(request, env, {
    itinerary,
    unlock: { mock: true, alreadyUnlocked },
  });
}
