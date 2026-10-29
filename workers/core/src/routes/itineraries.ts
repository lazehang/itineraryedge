import {
  normalizeEmail,
  validateCreateItineraryInput,
} from "@itineraryedge/shared";
import { findOrCreateProfileByEmail, findProfileByEmail } from "../db/profiles.js";
import {
  getItineraryById,
  insertItinerary,
  listItinerariesForProfile,
} from "../db/itineraries.js";
import { jsonResponse } from "../cors.js";
import type { Env } from "../index.js";

async function requireProfileForEmail(
  request: Request,
  db: D1Database,
  emailParam: string | null,
): Promise<
  | { ok: true; profileId: string; email: string }
  | { ok: false; status: number; body: { error: string } }
> {
  if (!emailParam) {
    return {
      ok: false,
      status: 400,
      body: { error: "Query parameter email is required." },
    };
  }

  const email = normalizeEmail(emailParam);
  const profile = await findProfileByEmail(db, email);
  if (!profile) {
    return {
      ok: false,
      status: 404,
      body: { error: "No profile found for this email." },
    };
  }

  return { ok: true, profileId: profile.id, email };
}

export async function handleItinerariesRoute(
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response | null> {
  const url = new URL(request.url);

  if (pathname === "/api/itineraries" || pathname === "/api/itineraries/") {
    if (request.method === "GET") {
      const email = url.searchParams.get("email");
      const auth = await requireProfileForEmail(request, env.DB, email);
      if (!auth.ok) {
        return jsonResponse(request, auth.body, { status: auth.status });
      }

      const items = await listItinerariesForProfile(env.DB, auth.profileId);
      return jsonResponse(request, { email: auth.email, itineraries: items });
    }

    if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(request, { error: "Invalid JSON body." }, { status: 400 });
      }

      const validated = validateCreateItineraryInput(body);
      if (!validated.ok) {
        return jsonResponse(request, { errors: validated.errors }, { status: 422 });
      }

      const profile = await findOrCreateProfileByEmail(
        env.DB,
        validated.value.email,
        validated.value.travelerName,
      );

      const itinerary = await insertItinerary(env.DB, profile.id, validated.value);

      return jsonResponse(request, { itinerary }, { status: 201 });
    }

    return jsonResponse(request, { error: "Method not allowed." }, { status: 405 });
  }

  const detailMatch = /^\/api\/itineraries\/([^/]+)\/?$/.exec(pathname);
  if (detailMatch) {
    const id = detailMatch[1];
    if (request.method !== "GET") {
      return jsonResponse(request, { error: "Method not allowed." }, { status: 405 });
    }

    const email = url.searchParams.get("email");
    const auth = await requireProfileForEmail(request, env.DB, email);
    if (!auth.ok) {
      return jsonResponse(request, auth.body, { status: auth.status });
    }

    const itinerary = await getItineraryById(env.DB, id);
    if (!itinerary || itinerary.profileId !== auth.profileId) {
      return jsonResponse(request, { error: "Itinerary not found." }, { status: 404 });
    }

    return jsonResponse(request, { itinerary });
  }

  return null;
}
