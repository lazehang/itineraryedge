-- ItineraryEdge D1 — global data (Iteration 1 scaffold)
-- Apply with: wrangler d1 migrations apply itineraryedge-global --local|--remote

CREATE TABLE IF NOT EXISTS global_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_global_profiles_email ON global_profiles (email);

CREATE TABLE IF NOT EXISTS universal_itineraries (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  is_premium_unlocked INTEGER NOT NULL DEFAULT 0 CHECK (is_premium_unlocked IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES global_profiles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_universal_itineraries_profile
  ON universal_itineraries (profile_id);

CREATE TABLE IF NOT EXISTS global_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT,
  event_type TEXT NOT NULL,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES global_profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_global_ledger_profile ON global_ledger (profile_id);
CREATE INDEX IF NOT EXISTS idx_global_ledger_event_type ON global_ledger (event_type);
