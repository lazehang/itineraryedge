import type { CreateItineraryInput } from "./validation";
import { normalizeCountryCode, normalizeEmail } from "./validation";
import type {
  ExtractedPlanFields,
  PlanFieldErrors,
  PlanItineraryInput,
} from "./plan-types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_ALPHA2 = /^[A-Z]{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const PROMPT_MIN = 12;
const PROMPT_MAX = 4000;

export function validatePlanItineraryInput(raw: unknown):
  | { ok: true; value: PlanItineraryInput }
  | { ok: false; errors: PlanFieldErrors } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: { email: "Invalid request body." } };
  }

  const body = raw as Record<string, unknown>;
  const errors: PlanFieldErrors = {};

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!email || !EMAIL.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length < PROMPT_MIN) {
    errors.prompt = `Describe your trip in at least ${PROMPT_MIN} characters.`;
  } else if (prompt.length > PROMPT_MAX) {
    errors.prompt = `Prompt must be at most ${PROMPT_MAX} characters.`;
  }

  const optionalString = (key: keyof PlanFieldErrors): string | undefined => {
    const value = body[key as string];
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    if (typeof value !== "string") {
      errors[key] = "Must be text.";
      return undefined;
    }
    return value.trim();
  };

  const travelerName = optionalString("travelerName");
  if (travelerName !== undefined && travelerName.length > 120) {
    errors.travelerName = "Traveler name is required (max 120 characters).";
  }

  let passportNationality: string | undefined;
  const passportRaw = optionalString("passportNationality");
  if (passportRaw !== undefined) {
    passportNationality = normalizeCountryCode(passportRaw);
    if (!ISO_ALPHA2.test(passportNationality)) {
      errors.passportNationality = "Passport nationality must be ISO alpha-2 (e.g. US).";
    }
  }

  let destinationCountry: string | undefined;
  const destRaw = optionalString("destinationCountry");
  if (destRaw !== undefined) {
    destinationCountry = normalizeCountryCode(destRaw);
    if (!ISO_ALPHA2.test(destinationCountry)) {
      errors.destinationCountry = "Destination must be ISO alpha-2 (e.g. JP).";
    }
  }

  let startDate: string | undefined;
  const startRaw = optionalString("startDate");
  if (startRaw !== undefined) {
    startDate = startRaw;
    if (!DATE.test(startDate) || Number.isNaN(Date.parse(startDate))) {
      errors.startDate = "Start date must be YYYY-MM-DD.";
    }
  }

  let endDate: string | undefined;
  const endRaw = optionalString("endDate");
  if (endRaw !== undefined) {
    endDate = endRaw;
    if (!DATE.test(endDate) || Number.isNaN(Date.parse(endDate))) {
      errors.endDate = "End date must be YYYY-MM-DD.";
    }
  }

  if (startDate && endDate && !errors.startDate && !errors.endDate && startDate > endDate) {
    errors.endDate = "End date must be on or after start date.";
  }

  let title: string | undefined;
  const titleRaw = optionalString("title");
  if (titleRaw !== undefined) {
    if (!titleRaw || titleRaw.length > 200) {
      errors.title = "Title must be 1–200 characters when provided.";
    } else {
      title = titleRaw;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      email,
      prompt,
      ...(travelerName ? { travelerName } : {}),
      ...(passportNationality ? { passportNationality } : {}),
      ...(destinationCountry ? { destinationCountry } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(title ? { title } : {}),
    },
  };
}

export function mergePlanHints(
  input: PlanItineraryInput,
  extracted: Partial<ExtractedPlanFields>,
):
  | { ok: true; value: CreateItineraryInput; prompt: string }
  | { ok: false; errors: PlanFieldErrors } {
  const errors: PlanFieldErrors = {};

  const travelerName = (input.travelerName ?? extracted.travelerName ?? "").trim();
  if (!travelerName || travelerName.length > 120) {
    errors.travelerName =
      "Could not determine traveler name — add it in details or name yourself in the prompt.";
  }

  const passportNationality = normalizeCountryCode(
    input.passportNationality ?? extracted.passportNationality ?? "",
  );
  if (!ISO_ALPHA2.test(passportNationality)) {
    errors.passportNationality =
      "Could not determine passport nationality (ISO alpha-2) — add it in details.";
  }

  const destinationCountry = normalizeCountryCode(
    input.destinationCountry ?? extracted.destinationCountry ?? "",
  );
  if (!ISO_ALPHA2.test(destinationCountry)) {
    errors.destinationCountry =
      "Could not determine destination country (ISO alpha-2) — name a country or add it in details.";
  }

  const startDate = (input.startDate ?? extracted.startDate ?? "").trim();
  if (!DATE.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.startDate =
      "Could not determine start date (YYYY-MM-DD) — include dates in the prompt or details.";
  }

  const endDate = (input.endDate ?? extracted.endDate ?? "").trim();
  if (!DATE.test(endDate) || Number.isNaN(Date.parse(endDate))) {
    errors.endDate =
      "Could not determine end date (YYYY-MM-DD) — include dates in the prompt or details.";
  }

  if (!errors.startDate && !errors.endDate && startDate > endDate) {
    errors.endDate = "End date must be on or after start date.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    prompt: input.prompt,
    value: {
      email: input.email,
      travelerName,
      passportNationality,
      destinationCountry,
      startDate,
      endDate,
      title: input.title ?? extracted.title,
    },
  };
}
