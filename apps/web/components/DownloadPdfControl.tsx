"use client";

import { useCallback, useMemo, useState } from "react";
import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";
import { getCoreApiBaseUrl } from "@/lib/core-api";

type Props = {
  itineraryId: string;
  email: string;
  hasGeneration: boolean;
};

type DownloadState = "idle" | "loading" | "error";

export function DownloadPdfControl({ itineraryId, email, hasGeneration }: Props) {
  const [state, setState] = useState<DownloadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pdfUrl = useMemo(() => {
    const url = new URL(`${getCoreApiBaseUrl()}/api/itineraries/${itineraryId}/pdf`);
    url.searchParams.set("email", email);
    return url.toString();
  }, [email, itineraryId]);

  const onDownload = useCallback(async () => {
    if (!hasGeneration) {
      return;
    }

    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(pdfUrl, { cache: "no-store" });
      if (!response.ok) {
        let message = "Could not download PDF.";
        try {
          const body = (await response.json()) as { error?: string; code?: string };
          if (body.code === "NOT_GENERATED") {
            message = "Generate the open-mode packet before downloading a PDF.";
          } else if (body.error) {
            message = body.error;
          }
        } catch {
          // ignore parse errors
        }
        setErrorMessage(message);
        setState("error");
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `itineraryedge-${itineraryId}.pdf`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setState("idle");
    } catch {
      setErrorMessage("Network error while downloading PDF.");
      setState("error");
    }
  }, [hasGeneration, itineraryId, pdfUrl]);

  return (
    <section className="card stack" style={{ marginTop: "1rem" }}>
      <h2 className="section-title">Download PDF (standard mode)</h2>
      <p className="muted text-sm">{ITINERARY_DISCLAIMER}</p>

      {hasGeneration ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void onDownload()}
          disabled={state === "loading"}
          aria-busy={state === "loading"}
        >
          {state === "loading" ? "Preparing PDF…" : "Download PDF"}
        </button>
      ) : (
        <>
          <button type="button" className="btn btn-secondary" disabled>
            Download PDF
          </button>
          <p className="muted text-sm">
            Run generate first — PDF download is unavailable until flight, hotel, and sightseeing
            JSON are saved (<code>NOT_GENERATED</code>).
          </p>
        </>
      )}

      {state === "error" && errorMessage ? (
        <div className="error-panel" role="alert">
          <strong>Download failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
