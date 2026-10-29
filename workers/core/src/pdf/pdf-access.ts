export type PdfVariant = "standard" | "polished";

export function resolvePdfVariant(
  pathname: string,
  variantParam: string | null,
): PdfVariant {
  if (/\/pdf\/polished\/?$/.test(pathname)) {
    return "polished";
  }

  const normalized = variantParam?.trim().toLowerCase();
  if (normalized === "polished") {
    return "polished";
  }

  return "standard";
}

export function polishedPdfAccess(
  variant: PdfVariant,
  isPremiumUnlocked: boolean,
): { allowed: true } | { allowed: false; code: "LOCKED" } {
  if (variant === "polished" && !isPremiumUnlocked) {
    return { allowed: false, code: "LOCKED" };
  }
  return { allowed: true };
}
