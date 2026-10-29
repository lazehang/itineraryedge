export const BYOK_SESSION_KEY = "itineraryedge:byok:ai";

export function readByokKeyFromSession(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(BYOK_SESSION_KEY)?.trim() ?? "";
}

export function writeByokKeyToSession(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const trimmed = key.trim();
  if (!trimmed) {
    sessionStorage.removeItem(BYOK_SESSION_KEY);
    return;
  }
  sessionStorage.setItem(BYOK_SESSION_KEY, trimmed);
}
