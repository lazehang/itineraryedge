export type PdfVariant = "standard" | "polished" | "ticket";

export function resolvePdfVariant(
  pathname: string,
  variantParam: string | null,
): PdfVariant {
  if (/\/pdf\/polished\/?$/.test(pathname)) {
    return "polished";
  }
  if (/\/pdf\/ticket\/?$/.test(pathname)) {
    return "ticket";
  }

  const normalized = variantParam?.trim().toLowerCase();
  if (normalized === "polished") {
    return "polished";
  }
  if (normalized === "ticket") {
    return "ticket";
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
