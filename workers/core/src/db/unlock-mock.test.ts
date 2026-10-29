import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unlockMockPremium } from "./itineraries.js";

type ItineraryState = {
  id: string;
  profile_id: string;
  is_premium_unlocked: number;
  updated_at: string;
};

type LedgerRow = {
  event_type: string;
  profile_id: string;
};

function createMockDb(initial: ItineraryState) {
  const itinerary = { ...initial };
  const ledger: LedgerRow[] = [];

  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>() {
              if (sql.includes("FROM universal_itineraries WHERE id = ?")) {
                return {
                  id: itinerary.id,
                  profile_id: itinerary.profile_id,
                  title: "Test",
                  payload_json: "{}",
                  destination_country: "JP",
                  flight_schedule_json: null,
                  hotel_inventory_json: null,
                  sightseeing_timeline_json: null,
                  is_premium_unlocked: itinerary.is_premium_unlocked,
                  created_at: "2026-01-01T00:00:00.000Z",
                  updated_at: itinerary.updated_at,
                } as T;
              }
              return null;
            },
            async all<T>() {
              return { results: [] as T[] };
            },
            async run() {
              if (sql.includes("UPDATE universal_itineraries")) {
                if (itinerary.is_premium_unlocked === 0) {
                  itinerary.is_premium_unlocked = 1;
                  itinerary.updated_at = args[0] as string;
                  return { success: true, meta: { changes: 1 } };
                }
                return { success: true, meta: { changes: 0 } };
              }
              if (sql.includes("INSERT INTO global_ledger")) {
                ledger.push({
                  event_type: "mock_unlock",
                  profile_id: args[1] as string,
                });
              }
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
      };
    },
    getItinerary: () => itinerary,
    getLedger: () => ledger,
  };

  return db as unknown as D1Database & {
    getItinerary: () => ItineraryState;
    getLedger: () => LedgerRow[];
  };
}

describe("unlockMockPremium", () => {
  it("is idempotent and writes ledger only on first unlock", async () => {
    const mock = createMockDb({
      id: "it-1",
      profile_id: "prof-1",
      is_premium_unlocked: 0,
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const first = await unlockMockPremium(mock, "prof-1", "it-1");
    assert.ok(first);
    assert.equal(first.isPremiumUnlocked, true);
    assert.equal(mock.getLedger().length, 1);

    const second = await unlockMockPremium(mock, "prof-1", "it-1");
    assert.ok(second);
    assert.equal(second.isPremiumUnlocked, true);
    assert.equal(mock.getLedger().length, 1);
  });
});
