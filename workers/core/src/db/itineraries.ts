import {
  buildTravelItineraryPayload,
  defaultItineraryTitle,
  parseDestinationCountryFromPayload,
  type CreateItineraryInput,
} from "@itineraryedge/shared";

export type ItineraryRow = {
  id: string;
  profile_id: string;
  title: string;
  payload_json: string;
  destination_country: string;
  is_premium_unlocked: number;
  created_at: string;
  updated_at: string;
};

export type ItineraryRecord = {
  id: string;
  profileId: string;
  title: string;
  destinationCountry: string | null;
  payload: unknown;
  isPremiumUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

function rowToRecord(row: ItineraryRow): ItineraryRecord {
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    payload = null;
  }

  const destinationCountry =
    row.destination_country ||
    parseDestinationCountryFromPayload(row.payload_json);

  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    destinationCountry: destinationCountry || null,
    payload,
    isPremiumUnlocked: row.is_premium_unlocked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertItinerary(
  db: D1Database,
  profileId: string,
  input: CreateItineraryInput,
): Promise<ItineraryRecord> {
  const id = crypto.randomUUID();
  const payload = buildTravelItineraryPayload(input);
  const title = defaultItineraryTitle(input.destinationCountry, input.title);
  const payloadJson = JSON.stringify(payload);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO universal_itineraries
        (id, profile_id, title, payload_json, destination_country, is_premium_unlocked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .bind(id, profileId, title, payloadJson, input.destinationCountry, now, now)
    .run();

  return rowToRecord({
    id,
    profile_id: profileId,
    title,
    payload_json: payloadJson,
    destination_country: input.destinationCountry,
    is_premium_unlocked: 0,
    created_at: now,
    updated_at: now,
  });
}

export async function listItinerariesForProfile(
  db: D1Database,
  profileId: string,
): Promise<ItineraryRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, profile_id, title, payload_json, destination_country, is_premium_unlocked, created_at, updated_at
       FROM universal_itineraries
       WHERE profile_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(profileId)
    .all<ItineraryRow>();

  return (results ?? []).map(rowToRecord);
}

export async function getItineraryById(
  db: D1Database,
  id: string,
): Promise<ItineraryRecord | null> {
  const row = await db
    .prepare(
      `SELECT id, profile_id, title, payload_json, destination_country, is_premium_unlocked, created_at, updated_at
       FROM universal_itineraries WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<ItineraryRow>();

  return row ? rowToRecord(row) : null;
}
