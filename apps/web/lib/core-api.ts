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
