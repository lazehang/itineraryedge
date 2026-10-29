const coreBaseUrl =
  process.env.NEXT_PUBLIC_CORE_WORKER_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8787";

export type ItinerarySummary = {
  id: string;
  profileId: string;
  title: string;
  destinationCountry: string | null;
  isPremiumUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ItineraryDetail = ItinerarySummary & {
  payload: unknown;
  flightSchedule: unknown;
  hotelInventory: unknown;
  sightseeingTimeline: unknown;
};

export type GenerateErrorCode = "VALIDATION" | "SAME_DAY" | "BYOK";

export type GenerateItineraryResult =
  | { ok: true; itinerary: ItineraryDetail; driver: string }
  | {
      ok: false;
      code?: GenerateErrorCode;
      message: string;
      details?: string[];
    };

type ApiErrorBody = {
  error?: string;
  errors?: Record<string, string>;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Unexpected response from core API.");
  }
}

export function getCoreApiBaseUrl(): string {
  return coreBaseUrl;
}

export async function createItinerary(input: {
  email: string;
  travelerName: string;
  passportNationality: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  title?: string;
}): Promise<{ ok: true; itinerary: ItineraryDetail } | { ok: false; errors: Record<string, string> }> {
  const response = await fetch(`${coreBaseUrl}/api/itineraries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const body = await parseJsonResponse<{ itinerary?: ItineraryDetail } & ApiErrorBody>(response);

  if (response.status === 422 && body.errors) {
    return { ok: false, errors: body.errors };
  }

  if (!response.ok || !body.itinerary) {
    const message = body.error ?? "Could not save itinerary draft.";
    return { ok: false, errors: { email: message } };
  }

  return { ok: true, itinerary: body.itinerary };
}

export async function listItineraries(email: string): Promise<ItinerarySummary[]> {
  const url = new URL(`${coreBaseUrl}/api/itineraries`);
  url.searchParams.set("email", email);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  const body = await parseJsonResponse<{ itineraries?: ItinerarySummary[] }>(response);
  return body.itineraries ?? [];
}

export async function getItinerary(
  id: string,
  email: string,
): Promise<ItineraryDetail | null> {
  const url = new URL(`${coreBaseUrl}/api/itineraries/${id}`);
  url.searchParams.set("email", email);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const body = await parseJsonResponse<{ itinerary?: ItineraryDetail }>(response);
  return body.itinerary ?? null;
}

export async function unlockMockPremium(
  id: string,
  email: string,
): Promise<
  | { ok: true; itinerary: ItineraryDetail; alreadyUnlocked: boolean }
  | { ok: false; message: string }
> {
  const url = new URL(`${coreBaseUrl}/api/itineraries/${id}/unlock-mock`);
  url.searchParams.set("email", email);

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
  });

  const body = await parseJsonResponse<{
    itinerary?: ItineraryDetail;
    unlock?: { alreadyUnlocked?: boolean };
    error?: string;
  }>(response);

  if (!response.ok || !body.itinerary) {
    return { ok: false, message: body.error ?? "Could not unlock demo premium." };
  }

  return {
    ok: true,
    itinerary: body.itinerary,
    alreadyUnlocked: Boolean(body.unlock?.alreadyUnlocked),
  };
}

export async function generateItinerary(
  id: string,
  email: string,
  byokKey?: string,
): Promise<GenerateItineraryResult> {
  const url = new URL(`${coreBaseUrl}/api/itineraries/${id}/generate`);
  url.searchParams.set("email", email);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = byokKey?.trim();
  if (key) {
    headers["X-BYOK-Key"] = key;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  const body = await parseJsonResponse<{
    itinerary?: ItineraryDetail;
    generation?: { driver?: string };
    code?: GenerateErrorCode;
    error?: string;
    details?: string[];
  }>(response);

  if (!response.ok) {
    return {
      ok: false,
      code: body.code,
      message: body.error ?? "Generation failed.",
      details: body.details,
    };
  }

  if (!body.itinerary) {
    return { ok: false, message: "Generation succeeded but no itinerary was returned." };
  }

  return {
    ok: true,
    itinerary: body.itinerary,
    driver: body.generation?.driver ?? "unknown",
  };
}
