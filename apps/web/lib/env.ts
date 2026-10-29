/** Public Pages origin for Stripe return URLs (set after first CF Pages deploy). */
export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

/** Mirrors core worker ALLOW_MOCK_UNLOCK=1 for staging UI. */
export function isMockUnlockAllowedInWeb(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_MOCK_UNLOCK === "1";
}

/** Public billing worker (Worker B) — no Stripe secrets in this app. */
export function getBillingWorkerBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_BILLING_WORKER_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/$/, "");
}
