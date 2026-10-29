/** Canonical Travel packet unlock labels (Designer Stage 1b). */
export const TRAVEL_PACKET_COPY = {
  payToUnlock: "Pay to unlock",
  demoUnlockStaging: "Demo unlock (staging)",
  badgePremiumUnlocked: "Premium unlocked",
  badgeDemoUnlocked: "Demo unlocked",
  testCheckoutChip: "Test checkout",
  polishedBadgePremium: "Premium",
  polishedBadgeDemo: "Demo premium",
} as const;

export type PremiumUnlockBadgeKind = "premium" | "demo";

export function premiumUnlockBadgeLabel(kind: PremiumUnlockBadgeKind): string {
  return kind === "demo"
    ? TRAVEL_PACKET_COPY.badgeDemoUnlocked
    : TRAVEL_PACKET_COPY.badgePremiumUnlocked;
}
