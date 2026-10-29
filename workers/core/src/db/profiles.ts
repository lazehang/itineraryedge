import { normalizeEmail } from "@itineraryedge/shared";

export type GlobalProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
};

export async function findProfileByEmail(
  db: D1Database,
  email: string,
): Promise<GlobalProfileRow | null> {
  const normalized = normalizeEmail(email);
  return db
    .prepare(
      `SELECT id, email, display_name FROM global_profiles WHERE email = ? LIMIT 1`,
    )
    .bind(normalized)
    .first<GlobalProfileRow>();
}

export async function createProfile(
  db: D1Database,
  email: string,
  displayName: string,
): Promise<GlobalProfileRow> {
  const id = crypto.randomUUID();
  const normalized = normalizeEmail(email);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO global_profiles (id, email, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, normalized, displayName, now, now)
    .run();

  return { id, email: normalized, display_name: displayName };
}

export async function findOrCreateProfileByEmail(
  db: D1Database,
  email: string,
  displayName: string,
): Promise<GlobalProfileRow> {
  const existing = await findProfileByEmail(db, email);
  if (existing) {
    return existing;
  }
  return createProfile(db, email, displayName);
}
