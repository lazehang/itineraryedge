import {
  mergePlanHints,
  validatePlanItineraryInput,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { findOrCreateProfileByEmail } from "../db/profiles.js";
import { insertItinerary, persistGenerationArtifacts } from "../db/itineraries.js";
import { jsonResponse } from "../cors.js";
import type { Env } from "../index.js";
import { createGenerationDriver } from "../generation/drivers/factory.js";
import { extractPlanFields } from "../generation/plan-extract.js";
import { runItineraryGeneration } from "../generation/run-generation.js";

export async function handlePlanRoute(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(request, env, { error: "Method not allowed." }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, env, { error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validatePlanItineraryInput(body);
  if (!validated.ok) {
    return jsonResponse(request, env, { errors: validated.errors }, { status: 422 });
  }

  const needsExtract =
    !validated.value.travelerName ||
    !validated.value.passportNationality ||
    !validated.value.destinationCountry ||
    !validated.value.startDate ||
    !validated.value.endDate;

  const extracted = needsExtract
    ? await extractPlanFields(request, env, validated.value.prompt)
    : {};

  const merged = mergePlanHints(validated.value, extracted);
  if (!merged.ok) {
    return jsonResponse(
      request,
      env,
      {
        code: "VALIDATION",
        error: "Could not resolve required trip fields from the prompt.",
        errors: merged.errors,
      },
      { status: 422 },
    );
  }

  const profile = await findOrCreateProfileByEmail(
    env.DB,
    merged.value.email,
    merged.value.travelerName,
  );

  const itinerary = await insertItinerary(env.DB, profile.id, merged.value);
  const payload = itinerary.payload as TravelItinerary | null;
  if (!payload) {
    return jsonResponse(
      request,
      env,
      { error: "Created itinerary is missing payload." },
      { status: 500 },
    );
  }

  const driver = createGenerationDriver(request, env);
  const result = await runItineraryGeneration({
    payload,
    destinationCountry: itinerary.destinationCountry ?? merged.value.destinationCountry,
    driver,
    userPlanPrompt: merged.prompt,
  });

  if (!result.ok) {
    const status = result.code === "BYOK" ? 401 : 422;
    return jsonResponse(
      request,
      env,
      {
        itinerary,
        code: result.code,
        error: result.message,
        details: result.details,
      },
      { status },
    );
  }

  const updated = await persistGenerationArtifacts(env.DB, itinerary.id, {
    flightSchedule: result.bundle.flightSchedule,
    hotelInventory: result.bundle.hotelInventory,
    sightseeingTimeline: result.bundle.sightseeingTimeline,
  });

  if (!updated) {
    return jsonResponse(
      request,
      env,
      {
        itinerary,
        error: "Could not persist generation output.",
      },
      { status: 500 },
    );
  }

  return jsonResponse(
    request,
    env,
    {
      itinerary: updated,
      generation: {
        driver: result.driver,
        searchParams: result.bundle.searchParams,
      },
    },
    { status: 201 },
  );
}
