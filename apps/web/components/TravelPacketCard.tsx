"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatUnlockPriceLine,
  ITINERARY_DISCLAIMER,
  premiumUnlockBadgeLabel,
  TRAVEL_PACKET_COPY,
  type PremiumUnlockBadgeKind,
} from "@itineraryedge/shared";
import { createPremiumCheckoutSession } from "@/lib/billing-api";
import { getAppBaseUrl } from "@/lib/env";
import { getCoreApiBaseUrl, getItinerary, unlockMockPremium } from "@/lib/core-api";

type Props = {
  itineraryId: string;
  email: string;
  hasGeneration: boolean;
  initialUnlocked: boolean;
  destinationCountry: string | null;
  allowMockUnlock: boolean;
  checkoutReturn: "success" | "cancel" | null;
};

type DownloadTarget = "standard" | "polished";
type DownloadState = "idle" | "loading";
type UnlockState = "idle" | "loading" | "success" | "error";
type CheckoutState = "idle" | "loading" | "error";

export function TravelPacketCard({
  itineraryId,
  email,
  hasGeneration,
  initialUnlocked,
  destinationCountry,
  allowMockUnlock,
  checkoutReturn,
}: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [unlockKind, setUnlockKind] = useState<PremiumUnlockBadgeKind | null>(
    initialUnlocked ? "premium" : null,
  );
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [activeDownload, setActiveDownload] = useState<DownloadTarget | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [unlockState, setUnlockState] = useState<UnlockState>("idle");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLag, setCheckoutLag] = useState(false);

  useEffect(() => {
    setUnlocked(initialUnlocked);
    if (initialUnlocked && unlockKind === null) {
      setUnlockKind("premium");
    }
  }, [initialUnlocked, unlockKind]);

  const priceLine = useMemo(
    () => formatUnlockPriceLine(destinationCountry),
    [destinationCountry],
  );

  const pdfUrlFor = useCallback(
    (variant: DownloadTarget) => {
      const url = new URL(`${getCoreApiBaseUrl()}/api/itineraries/${itineraryId}/pdf`);
      url.searchParams.set("email", email);
      if (variant === "polished") {
        url.searchParams.set("variant", "polished");
      }
      return url.toString();
    },
    [email, itineraryId],
  );

  const filenameFor = useCallback(
    (variant: DownloadTarget) =>
      variant === "polished"
        ? `itineraryedge-${itineraryId}-polished.pdf`
        : `itineraryedge-${itineraryId}.pdf`,
    [itineraryId],
  );

  const onDownload = useCallback(
    async (variant: DownloadTarget) => {
      if (variant === "standard" && !hasGeneration) {
        return;
      }
      if (variant === "polished" && (!hasGeneration || !unlocked)) {
        return;
      }

      setDownloadState("loading");
      setActiveDownload(variant);
      setDownloadError(null);

      try {
        const response = await fetch(pdfUrlFor(variant), { cache: "no-store" });
        if (!response.ok) {
          let message = "Could not download PDF.";
          try {
            const body = (await response.json()) as { error?: string; code?: string };
            if (body.code === "NOT_GENERATED") {
              message = "Generate the schedule first.";
            } else if (body.code === "LOCKED") {
              message = "Unlock the polished PDF first.";
            } else if (body.error) {
              message = body.error;
            }
          } catch {
            // ignore parse errors
          }
          setDownloadError(message);
          setDownloadState("idle");
          setActiveDownload(null);
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filenameFor(variant);
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        setDownloadState("idle");
        setActiveDownload(null);
      } catch {
        setDownloadError("Network error while downloading PDF.");
        setDownloadState("idle");
        setActiveDownload(null);
      }
    },
    [filenameFor, hasGeneration, pdfUrlFor, unlocked],
  );

  const refreshUnlockFromServer = useCallback(async (): Promise<boolean> => {
    const itinerary = await getItinerary(itineraryId, email);
    if (itinerary?.isPremiumUnlocked) {
      setUnlocked(true);
      setUnlockKind("premium");
      router.refresh();
      return true;
    }
    return false;
  }, [email, itineraryId, router]);

  useEffect(() => {
    if (checkoutReturn !== "success" || unlocked) {
      return;
    }

    let cancelled = false;
    setCheckoutLag(false);

    void (async () => {
      const maxAttempts = 15;
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt += 1) {
        if (await refreshUnlockFromServer()) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (!cancelled) {
        setCheckoutLag(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutReturn, refreshUnlockFromServer, unlocked]);

  const onPayToUnlock = useCallback(async () => {
    if (unlocked) {
      return;
    }

    setCheckoutState("loading");
    setCheckoutError(null);

    const appBase = getAppBaseUrl();
    const returnBase = new URL(`${appBase}/itineraries/${itineraryId}`);
    returnBase.searchParams.set("email", email);
    const successUrl = new URL(returnBase);
    successUrl.searchParams.set("checkout", "success");
    const cancelUrl = new URL(returnBase);
    cancelUrl.searchParams.set("checkout", "cancel");

    const result = await createPremiumCheckoutSession({
      itineraryId,
      email,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      destinationCountry,
    });

    if (!result.ok) {
      setCheckoutError(result.message);
      setCheckoutState("error");
      return;
    }

    window.location.assign(result.checkoutUrl);
  }, [destinationCountry, email, itineraryId, unlocked]);

  const onMockUnlock = useCallback(async () => {
    if (unlocked || !allowMockUnlock) {
      return;
    }

    setUnlockState("loading");
    setUnlockError(null);

    const result = await unlockMockPremium(itineraryId, email);
    if (!result.ok) {
      setUnlockError(result.message);
      setUnlockState("error");
      return;
    }

    setUnlocked(true);
    setUnlockKind("demo");
    setUnlockState("success");
    router.refresh();
  }, [allowMockUnlock, email, itineraryId, router, unlocked]);

  const standardEnabled = hasGeneration;
  const polishedEnabled = hasGeneration && unlocked;

  const polishedHelper = useMemo(() => {
    if (!hasGeneration) {
      return "Generate the schedule first, then unlock the polished PDF.";
    }
    if (!unlocked) {
      return allowMockUnlock
        ? "Premium layout — pay to unlock, or use staging demo unlock below."
        : "Premium layout — pay to unlock to enable download.";
    }
    return "Premium layout — download the denser polished travel packet.";
  }, [allowMockUnlock, hasGeneration, unlocked]);

  const unlockedBadgeLabel =
    unlocked && unlockKind ? premiumUnlockBadgeLabel(unlockKind) : null;

  return (
    <section className="card stack" style={{ marginTop: "1rem" }}>
      <div className="card-heading">
        <h2 className="section-title">Travel packet</h2>
        <div className="packet-badges">
          <span className="badge">Standard</span>
          {allowMockUnlock ? (
            <span className="badge badge-premium">{TRAVEL_PACKET_COPY.testCheckoutChip}</span>
          ) : null}
          {unlockedBadgeLabel ? (
            <span className="badge badge-unlocked">{unlockedBadgeLabel}</span>
          ) : null}
        </div>
      </div>

      <p className="muted text-sm">{ITINERARY_DISCLAIMER}</p>

      {checkoutReturn === "cancel" && !unlocked ? (
        <div className="callout" role="status">
          <p className="text-sm">Checkout was canceled — you can try again when ready.</p>
        </div>
      ) : null}

      {checkoutReturn === "success" && !unlocked && checkoutState !== "error" ? (
        <div className="callout" role="status">
          <p className="text-sm">
            {checkoutLag
              ? "Payment received — waiting for unlock confirmation. Refresh in a moment if this persists (webhook lag)."
              : "Confirming your payment…"}
          </p>
        </div>
      ) : null}

      <div className="packet-row">
        <div className="packet-row__main">
          <strong>Standard PDF</strong>
          {!hasGeneration ? (
            <p className="muted text-sm">Generate the schedule first.</p>
          ) : (
            <p className="muted text-sm">Open-mode packet from generated JSON.</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void onDownload("standard")}
          disabled={!standardEnabled || downloadState === "loading"}
          aria-busy={downloadState === "loading" && activeDownload === "standard"}
        >
          {downloadState === "loading" && activeDownload === "standard"
            ? "Preparing…"
            : "Download standard PDF"}
        </button>
      </div>

      <div className="packet-row">
        <div className="packet-row__main">
          <div className="packet-row__title">
            <strong>Polished PDF</strong>
            <span className="badge badge-premium">
              {allowMockUnlock
                ? TRAVEL_PACKET_COPY.polishedBadgeDemo
                : TRAVEL_PACKET_COPY.polishedBadgePremium}
            </span>
          </div>
          <p className="muted text-sm">{polishedHelper}</p>
        </div>
        <button
          type="button"
          className={unlocked && hasGeneration ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => void onDownload("polished")}
          disabled={!polishedEnabled || downloadState === "loading"}
          aria-busy={downloadState === "loading" && activeDownload === "polished"}
        >
          {downloadState === "loading" && activeDownload === "polished"
            ? "Preparing…"
            : "Download polished PDF"}
        </button>
      </div>

      {downloadError ? (
        <div className="error-panel" role="alert">
          <strong>Download failed</strong>
          <p>{downloadError}</p>
        </div>
      ) : null}

      {!unlocked ? (
        <div className="callout stack unlock-block">
          <p className="text-sm">{priceLine}</p>
          <div className="unlock-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void onPayToUnlock()}
              disabled={checkoutState === "loading"}
              aria-busy={checkoutState === "loading"}
            >
              {checkoutState === "loading"
                ? "Starting checkout…"
                : TRAVEL_PACKET_COPY.payToUnlock}
            </button>
            {allowMockUnlock ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void onMockUnlock()}
                disabled={unlockState === "loading"}
                aria-busy={unlockState === "loading"}
              >
                {unlockState === "loading"
                  ? "Unlocking…"
                  : TRAVEL_PACKET_COPY.demoUnlockStaging}
              </button>
            ) : null}
          </div>
          {checkoutState === "error" && checkoutError ? (
            <div className="error-panel" role="alert">
              <strong>Checkout failed</strong>
              <p>{checkoutError}</p>
            </div>
          ) : null}
          {unlockState === "error" && unlockError ? (
            <div className="error-panel" role="alert">
              <strong>Demo unlock failed</strong>
              <p>{unlockError}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {unlockState === "success" && unlockKind === "demo" ? (
        <p className="text-sm" role="status">
          {hasGeneration
            ? "Demo unlocked for this itinerary — you can download the polished PDF above."
            : "Demo unlocked — generate the schedule first, then download the polished PDF."}
        </p>
      ) : null}
    </section>
  );
}
