/** True when mock premium unlock is permitted (local/staging). */
export function isMockUnlockAllowed(env: { ALLOW_MOCK_UNLOCK?: string }): boolean {
  return env.ALLOW_MOCK_UNLOCK === "1";
}
