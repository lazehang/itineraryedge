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
  flight_schedule_json: string | null;
  hotel_inventory_json: string | null;
  sightseeing_timeline_json: string | null;
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
  flightSchedule: unknown;
  hotelInventory: unknown;
  sightseeingTimeline: unknown;
  isPremiumUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

function parseJsonColumn(raw: string | null): unknown {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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
    flightSchedule: parseJsonColumn(row.flight_schedule_json),
    hotelInventory: parseJsonColumn(row.hotel_inventory_json),
    sightseeingTimeline: parseJsonColumn(row.sightseeing_timeline_json),
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
        (id, profile_id, title, payload_json, destination_country,
         flight_schedule_json, hotel_inventory_json, sightseeing_timeline_json,
         is_premium_unlocked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 0, ?, ?)`,
    )
    .bind(id, profileId, title, payloadJson, input.destinationCountry, now, now)
    .run();

  return rowToRecord({
    id,
    profile_id: profileId,
    title,
    payload_json: payloadJson,
    destination_country: input.destinationCountry,
    flight_schedule_json: null,
    hotel_inventory_json: null,
    sightseeing_timeline_json: null,
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
      `SELECT id, profile_id, title, payload_json, destination_country,
              flight_schedule_json, hotel_inventory_json, sightseeing_timeline_json,
              is_premium_unlocked, created_at, updated_at
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
      `SELECT id, profile_id, title, payload_json, destination_country,
              flight_schedule_json, hotel_inventory_json, sightseeing_timeline_json,
              is_premium_unlocked, created_at, updated_at
       FROM universal_itineraries WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<ItineraryRow>();

  return row ? rowToRecord(row) : null;
}

export async function persistGenerationArtifacts(
  db: D1Database,
  id: string,
  bundle: {
    flightSchedule: unknown;
    hotelInventory: unknown;
    sightseeingTimeline: unknown;
  },
): Promise<ItineraryRecord | null> {
  const now = new Date().toISOString();
  const flightJson = JSON.stringify(bundle.flightSchedule);
  const hotelJson = JSON.stringify(bundle.hotelInventory);
  const sightseeingJson = JSON.stringify(bundle.sightseeingTimeline);

  await db
    .prepare(
      `UPDATE universal_itineraries
       SET flight_schedule_json = ?, hotel_inventory_json = ?, sightseeing_timeline_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(flightJson, hotelJson, sightseeingJson, now, id)
    .run();

  return getItineraryById(db, id);
}

export async function unlockMockPremium(
  db: D1Database,
  profileId: string,
  itineraryId: string,
): Promise<ItineraryRecord | null> {
  const existing = await getItineraryById(db, itineraryId);
  if (!existing || existing.profileId !== profileId) {
    return null;
  }

  if (existing.isPremiumUnlocked) {
    return existing;
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE universal_itineraries
       SET is_premium_unlocked = 1, updated_at = ?
       WHERE id = ? AND profile_id = ?`,
    )
    .bind(now, itineraryId, profileId)
    .run();

  await db
    .prepare(
      `INSERT INTO global_ledger (id, profile_id, event_type, amount_cents, currency, metadata_json, created_at)
       VALUES (?, ?, 'mock_unlock', 0, 'USD', ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      profileId,
      JSON.stringify({ itineraryId, source: "mock_unlock" }),
      now,
    )
    .run();

  return getItineraryById(db, itineraryId);
}
