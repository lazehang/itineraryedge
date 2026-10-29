import {
  type GenerationFlightSchedule,
  type GenerationHotelInventory,
  type GenerationSightseeingTimeline,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { pdfResponse } from "../cors.js";
import type { ItineraryRecord } from "../db/itineraries.js";
import { getItineraryById } from "../db/itineraries.js";
import { findProfileByEmail } from "../db/profiles.js";
import type { Env } from "../index.js";
import { compilePolishedPdf } from "../pdf/compile-polished-pdf.js";
import { compileStandardPdf } from "../pdf/compile-standard-pdf.js";
import { polishedPdfAccess, resolvePdfVariant, type PdfVariant } from "../pdf/pdf-access.js";

function hasGenerationArtifacts(itinerary: ItineraryRecord): boolean {
  return Boolean(
    itinerary.flightSchedule && itinerary.hotelInventory && itinerary.sightseeingTimeline,
  );
}

function asTravelItinerary(value: unknown): TravelItinerary | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as TravelItinerary;
  if (!candidate.traveler || !Array.isArray(candidate.segments)) {
    return null;
  }
  return candidate;
}

function asFlightSchedule(value: unknown): GenerationFlightSchedule | null {
  if (typeof value !== "object" || value === null || !("segments" in value)) {
    return null;
  }
  const segments = (value as GenerationFlightSchedule).segments;
  return Array.isArray(segments) ? (value as GenerationFlightSchedule) : null;
}

function asHotelInventory(value: unknown): GenerationHotelInventory | null {
  if (typeof value !== "object" || value === null || !("hotels" in value)) {
    return null;
  }
  const hotels = (value as GenerationHotelInventory).hotels;
  return Array.isArray(hotels) ? (value as GenerationHotelInventory) : null;
}

function asSightseeingTimeline(value: unknown): GenerationSightseeingTimeline | null {
  if (typeof value !== "object" || value === null || !("days" in value)) {
    return null;
  }
  const days = (value as GenerationSightseeingTimeline).days;
  return Array.isArray(days) ? (value as GenerationSightseeingTimeline) : null;
}

export async function handlePdfRoute(
  request: Request,
  env: Env,
  itineraryId: string,
  profileId: string,
  profileEmail: string,
  pathname: string,
): Promise<Response> {
  if (request.method !== "GET") {
    return pdfResponse(request, new Uint8Array(), {
      status: 405,
      jsonError: { error: "Method not allowed." },
    });
  }

  const url = new URL(request.url);
  const variant = resolvePdfVariant(pathname, url.searchParams.get("variant"));

  const itinerary = await getItineraryById(env.DB, itineraryId);
  if (!itinerary || itinerary.profileId !== profileId) {
    return pdfResponse(request, new Uint8Array(), {
      status: 404,
      jsonError: { error: "Itinerary not found." },
    });
  }

  const access = polishedPdfAccess(variant, itinerary.isPremiumUnlocked);
  if (!access.allowed) {
    return pdfResponse(request, new Uint8Array(), {
      status: 403,
      jsonError: {
        error: "Polished PDF requires a demo premium unlock.",
        code: access.code,
      },
    });
  }

  if (!hasGenerationArtifacts(itinerary)) {
    return pdfResponse(request, new Uint8Array(), {
      status: 409,
      jsonError: { error: "Generation has not been run for this itinerary.", code: "NOT_GENERATED" },
    });
  }

  const flightSchedule = asFlightSchedule(itinerary.flightSchedule);
  const hotelInventory = asHotelInventory(itinerary.hotelInventory);
  const sightseeingTimeline = asSightseeingTimeline(itinerary.sightseeingTimeline);

  if (!flightSchedule || !hotelInventory || !sightseeingTimeline) {
    return pdfResponse(request, new Uint8Array(), {
      status: 409,
      jsonError: { error: "Generation has not been run for this itinerary.", code: "NOT_GENERATED" },
    });
  }

  const profile = await findProfileByEmail(env.DB, profileEmail);

  const compileInput = {
    itineraryId: itinerary.id,
    title: itinerary.title,
    destinationCountry: itinerary.destinationCountry,
    profileEmail,
    profileDisplayName: profile?.display_name ?? null,
    payload: asTravelItinerary(itinerary.payload),
    flightSchedule,
    hotelInventory,
    sightseeingTimeline,
  };

  const compiled =
    variant === "polished"
      ? await compilePolishedPdf(compileInput)
      : await compileStandardPdf(compileInput);

  if (!compiled.ok) {
    return pdfResponse(request, new Uint8Array(), {
      status: 413,
      jsonError: { error: compiled.message, code: compiled.code },
    });
  }

  const filename =
    variant === "polished"
      ? `itineraryedge-${itinerary.id}-polished.pdf`
      : `itineraryedge-${itinerary.id}.pdf`;

  return pdfResponse(request, compiled.bytes, {
    status: 200,
    filename,
  });
}

export { type PdfVariant };
