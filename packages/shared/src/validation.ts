import {
  ITINERARY_DISCLAIMER,
  ITINERARY_SCHEMA_VERSION,
  type TravelItinerary,
} from "./types";

const ISO_ALPHA2 = /^[A-Z]{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CreateItineraryInput = {
  email: string;
  travelerName: string;
  passportNationality: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  title?: string;
};

export type FieldErrors = Partial<Record<keyof CreateItineraryInput, string>>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateCreateItineraryInput(raw: unknown): {
  ok: true;
  value: CreateItineraryInput;
} | {
  ok: false;
  errors: FieldErrors;
} {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: { email: "Invalid request body." } };
  }

  const body = raw as Record<string, unknown>;
  const errors: FieldErrors = {};

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!email || !EMAIL.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const travelerName =
    typeof body.travelerName === "string" ? body.travelerName.trim() : "";
  if (!travelerName || travelerName.length > 120) {
    errors.travelerName = "Traveler name is required (max 120 characters).";
  }

  const passportNationality =
    typeof body.passportNationality === "string"
      ? normalizeCountryCode(body.passportNationality)
      : "";
  if (!ISO_ALPHA2.test(passportNationality)) {
    errors.passportNationality = "Passport nationality must be ISO alpha-2 (e.g. US).";
  }

  const destinationCountry =
    typeof body.destinationCountry === "string"
      ? normalizeCountryCode(body.destinationCountry)
      : "";
  if (!ISO_ALPHA2.test(destinationCountry)) {
    errors.destinationCountry = "Destination must be ISO alpha-2 (e.g. JP).";
  }

  const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
  if (!DATE.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.startDate = "Start date must be YYYY-MM-DD.";
  }

  const endDate = typeof body.endDate === "string" ? body.endDate.trim() : "";
  if (!DATE.test(endDate) || Number.isNaN(Date.parse(endDate))) {
    errors.endDate = "End date must be YYYY-MM-DD.";
  }

  if (!errors.startDate && !errors.endDate && startDate > endDate) {
    errors.endDate = "End date must be on or after start date.";
  }

  let title: string | undefined;
  if (body.title !== undefined && body.title !== null && body.title !== "") {
    if (typeof body.title !== "string") {
      errors.title = "Title must be text.";
    } else {
      const trimmed = body.title.trim();
      if (!trimmed || trimmed.length > 200) {
        errors.title = "Title must be 1–200 characters when provided.";
      } else {
        title = trimmed;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      email,
      travelerName,
      passportNationality,
      destinationCountry,
      startDate,
      endDate,
      title,
    },
  };
}

export function defaultItineraryTitle(
  destinationCountry: string,
  title?: string,
): string {
  if (title) {
    return title;
  }
  return `Trip to ${destinationCountry}`;
}

/** Build TravelItinerary v1 payload; stay segment location mirrors destination country. */
export function buildTravelItineraryPayload(
  input: CreateItineraryInput,
): TravelItinerary {
  const title = defaultItineraryTitle(input.destinationCountry, input.title);

  return {
    schemaVersion: ITINERARY_SCHEMA_VERSION,
    title,
    traveler: {
      displayName: input.travelerName,
      passportCountry: input.passportNationality,
    },
    segments: [
      {
        kind: "stay",
        label: `Stay in ${input.destinationCountry}`,
        location: input.destinationCountry,
        startDate: input.startDate,
        endDate: input.endDate,
      },
    ],
    disclaimer: ITINERARY_DISCLAIMER,
  };
}

export function parseDestinationCountryFromPayload(
  payloadJson: string,
): string | null {
  try {
    const parsed = JSON.parse(payloadJson) as TravelItinerary;
    const stay = parsed.segments?.find((s) => s.kind === "stay");
    return stay?.location ?? null;
  } catch {
    return null;
  }
}
