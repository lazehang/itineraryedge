import type { TravelItinerary } from "@itineraryedge/shared";
import { getItineraryById, persistGenerationArtifacts } from "../db/itineraries.js";
import { jsonResponse } from "../cors.js";
import type { Env } from "../index.js";
import { createGenerationDriver } from "../generation/drivers/factory.js";
import { runItineraryGeneration } from "../generation/run-generation.js";

export async function handleGenerateRoute(
  request: Request,
  env: Env,
  id: string,
  profileId: string,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "Method not allowed." }, { status: 405 });
  }

  const itinerary = await getItineraryById(env.DB, id);
  if (!itinerary || itinerary.profileId !== profileId) {
    return jsonResponse(request, { error: "Itinerary not found." }, { status: 404 });
  }

  const payload = itinerary.payload as TravelItinerary | null;
  if (!payload) {
    return jsonResponse(
      request,
      {
        code: "VALIDATION",
        error: "Itinerary payload is missing or invalid.",
      },
      { status: 422 },
    );
  }

  const driver = createGenerationDriver(request, env);
  const result = await runItineraryGeneration({
    payload,
    destinationCountry: itinerary.destinationCountry ?? payload.segments[0]?.location ?? "XX",
    driver,
  });

  if (!result.ok) {
    const status = result.code === "BYOK" ? 401 : 422;
    return jsonResponse(
      request,
      {
        code: result.code,
        error: result.message,
        details: result.details,
      },
      { status },
    );
  }

  const updated = await persistGenerationArtifacts(env.DB, id, {
    flightSchedule: result.bundle.flightSchedule,
    hotelInventory: result.bundle.hotelInventory,
    sightseeingTimeline: result.bundle.sightseeingTimeline,
  });

  if (!updated) {
    return jsonResponse(request, { error: "Could not persist generation output." }, { status: 500 });
  }

  return jsonResponse(request, {
    itinerary: updated,
    generation: {
      driver: result.driver,
      searchParams: result.bundle.searchParams,
    },
  });
}
