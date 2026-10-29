export type GeoPricingCurrency = "HKD" | "EUR" | "USD";

export type GeoPricingDisplay = {
  currency: GeoPricingCurrency;
  /** Whole currency units shown in UI (70, 9, 9) */
  amountMajor: number;
  /** Fragment for price line, e.g. HK$70, €9, $9 USD */
  displayAmount: string;
};

/** ISO 3166-1 alpha-2 euro area members (display pricing only; checkout on Worker B). */
const EUROZONE_ALPHA2 = new Set([
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
]);

function normalizeCountryCode(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }
  if (trimmed === "HKG") {
    return "HK";
  }
  return trimmed;
}

/**
 * Geo display pricing (SoT): HKG/HK → HK$70, Eurozone → €9, else → $9 USD.
 * Returns null when country is unknown — UI shows "Price shown at checkout".
 */
export function resolveGeoPricingDisplay(
  countryCode: string | null | undefined,
): GeoPricingDisplay | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) {
    return null;
  }

  if (code === "HK") {
    return { currency: "HKD", amountMajor: 70, displayAmount: "HK$70" };
  }

  if (EUROZONE_ALPHA2.has(code)) {
    return { currency: "EUR", amountMajor: 9, displayAmount: "€9" };
  }

  return { currency: "USD", amountMajor: 9, displayAmount: "$9 USD" };
}

/** Canonical unlock price line for Travel packet UI. */
export function formatUnlockPriceLine(countryCode: string | null | undefined): string {
  const pricing = resolveGeoPricingDisplay(countryCode);
  if (!pricing) {
    return "Unlock polished PDF · Price shown at checkout";
  }
  return `Unlock polished PDF · ${pricing.displayAmount}`;
}
