"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";
import { getCoreApiBaseUrl, unlockMockPremium } from "@/lib/core-api";

type Props = {
  itineraryId: string;
  email: string;
  hasGeneration: boolean;
  initialUnlocked: boolean;
};

type DownloadTarget = "standard" | "polished";
type DownloadState = "idle" | "loading";
type UnlockState = "idle" | "loading" | "success" | "error";

export function TravelPacketCard({
  itineraryId,
  email,
  hasGeneration,
  initialUnlocked,
}: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [activeDownload, setActiveDownload] = useState<DownloadTarget | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [unlockState, setUnlockState] = useState<UnlockState>("idle");
  const [unlockError, setUnlockError] = useState<string | null>(null);

  useEffect(() => {
    setUnlocked(initialUnlocked);
  }, [initialUnlocked]);

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
              message = "Unlock the demo premium polished PDF first.";
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

  const onUnlock = useCallback(async () => {
    if (unlocked) {
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
    setUnlockState("success");
    router.refresh();
  }, [email, itineraryId, router, unlocked]);

  const standardEnabled = hasGeneration;
  const polishedEnabled = hasGeneration && unlocked;

  const polishedHelper = useMemo(() => {
    if (!hasGeneration) {
      return "Generate the schedule first, then download the polished PDF.";
    }
    if (!unlocked) {
      return "Demo premium layout — unlock below (no charge) to enable download.";
    }
    return "Demo premium layout — download the denser polished travel packet.";
  }, [hasGeneration, unlocked]);

  return (
    <section className="card stack" style={{ marginTop: "1rem" }}>
      <div className="card-heading">
        <h2 className="section-title">Travel packet</h2>
        <div className="packet-badges">
          <span className="badge">Standard</span>
          {unlocked ? <span className="badge badge-unlocked">Demo unlocked</span> : null}
        </div>
      </div>

      <p className="muted text-sm">{ITINERARY_DISCLAIMER}</p>

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
            <span className="badge badge-premium">Demo premium</span>
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
          <p className="text-sm">
            Demo unlock only — no Stripe checkout and no charge. Unlocks the polished PDF layout for
            this itinerary in your browser session.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onUnlock()}
            disabled={unlockState === "loading"}
            aria-busy={unlockState === "loading"}
          >
            {unlockState === "loading"
              ? "Unlocking…"
              : "Unlock polished PDF (demo — no charge)"}
          </button>
          {unlockState === "success" ? (
            <p className="text-sm" role="status">
              Demo premium unlocked — you can download the polished PDF after generating the
              schedule.
            </p>
          ) : null}
          {unlockState === "error" && unlockError ? (
            <div className="error-panel" role="alert">
              <strong>Unlock failed</strong>
              <p>{unlockError}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
