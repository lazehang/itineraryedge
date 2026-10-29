"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  GenerationFlightSchedule,
  GenerationHotelInventory,
  GenerationSightseeingTimeline,
} from "@itineraryedge/shared";
import { generateItinerary, type ItineraryDetail } from "@/lib/core-api";
import { readByokKeyFromSession, writeByokKeyToSession } from "@/lib/byok";
import { SightseeingTimelineView } from "@/components/SightseeingTimelineView";

type UiState = "idle" | "loading" | "success" | "error" | "regenerate-confirm";

type Props = {
  itineraryId: string;
  email: string;
  initialItinerary: ItineraryDetail;
};

function isSightseeingTimeline(value: unknown): value is GenerationSightseeingTimeline {
  return (
    typeof value === "object" &&
    value !== null &&
    "days" in value &&
    Array.isArray((value as GenerationSightseeingTimeline).days)
  );
}

function isFlightSchedule(value: unknown): value is GenerationFlightSchedule {
  return (
    typeof value === "object" &&
    value !== null &&
    "segments" in value &&
    Array.isArray((value as GenerationFlightSchedule).segments)
  );
}

function isHotelInventory(value: unknown): value is GenerationHotelInventory {
  return (
    typeof value === "object" &&
    value !== null &&
    "hotels" in value &&
    Array.isArray((value as GenerationHotelInventory).hotels)
  );
}

export function GenerateCard({ itineraryId, email, initialItinerary }: Props) {
  const router = useRouter();
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [uiState, setUiState] = useState<UiState>(() =>
    initialItinerary.sightseeingTimeline ? "success" : "idle",
  );
  const [byokInput, setByokInput] = useState("");
  const [byokSaved, setByokSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [driverName, setDriverName] = useState<string | null>(null);

  useEffect(() => {
    setByokInput(readByokKeyFromSession());
  }, []);

  const hasTimeline = Boolean(itinerary.sightseeingTimeline);

  const sightseeing = useMemo(() => {
    if (!isSightseeingTimeline(itinerary.sightseeingTimeline)) {
      return null;
    }
    return itinerary.sightseeingTimeline;
  }, [itinerary.sightseeingTimeline]);

  const runGenerate = useCallback(async () => {
    setUiState("loading");
    setErrorMessage(null);
    setErrorDetails([]);

    const result = await generateItinerary(itineraryId, email, readByokKeyFromSession());

    if (!result.ok) {
      setErrorMessage(result.message);
      setErrorDetails(result.details ?? []);
      setUiState(hasTimeline ? "success" : "error");
      return;
    }

    setItinerary(result.itinerary);
    setDriverName(result.driver);
    setUiState("success");
    router.refresh();
  }, [email, hasTimeline, itineraryId, router]);

  const onSaveByok = () => {
    writeByokKeyToSession(byokInput);
    setByokSaved(true);
    window.setTimeout(() => setByokSaved(false), 2000);
  };

  const onGenerateClick = () => {
    if (hasTimeline) {
      setUiState("regenerate-confirm");
      return;
    }
    void runGenerate();
  };

  return (
    <section className="card stack" style={{ marginTop: "1rem" }}>
      <div className="card-heading">
        <h2 className="section-title">Generate open-mode packet</h2>
        {driverName ? <span className="badge">Driver: {driverName}</span> : null}
      </div>

      <p className="muted text-sm">
        Uses the mock driver when no BYOK key is saved in this browser session. Optional keys are
        sent only as <code>X-BYOK-Key</code> on generate requests (never stored in D1).
      </p>

      <div className="stack byok-panel">
        <label htmlFor="byok-key">BYOK AI key (session only)</label>
        <div className="inline-actions">
          <input
            id="byok-key"
            name="byok-key"
            type="password"
            autoComplete="off"
            placeholder="sk-… or Anthropic key"
            value={byokInput}
            onChange={(event) => setByokInput(event.target.value)}
          />
          <button type="button" className="btn btn-secondary" onClick={onSaveByok}>
            Save to session
          </button>
        </div>
        {byokSaved ? <p className="text-sm muted">Saved for this tab session.</p> : null}
      </div>

      {uiState === "regenerate-confirm" ? (
        <div className="callout stack">
          <p>Regenerate and replace flights, hotels, and the sightseeing timeline?</p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={() => void runGenerate()}>
              Confirm regenerate
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setUiState("success")}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerateClick}
          disabled={uiState === "loading"}
          aria-busy={uiState === "loading"}
        >
          {uiState === "loading"
            ? "Generating…"
            : hasTimeline
              ? "Regenerate packet"
              : "Generate packet"}
        </button>
      )}

      {uiState === "error" && errorMessage ? (
        <div className="error-panel" role="alert">
          <strong>Generation failed</strong>
          <p>{errorMessage}</p>
          {errorDetails.length > 0 ? (
            <ul>
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {uiState === "success" && errorMessage ? (
        <div className="error-panel" role="status">
          <strong>Regenerate failed — previous timeline kept</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {sightseeing ? (
        <div className="stack" style={{ marginTop: "0.5rem" }}>
          <h3 className="section-title">Sightseeing timeline</h3>
          <SightseeingTimelineView timeline={sightseeing} />
        </div>
      ) : null}

      {hasTimeline ? (
        <details className="details-block">
          <summary>Flights</summary>
          <pre className="json-preview">
            {JSON.stringify(
              isFlightSchedule(itinerary.flightSchedule) ? itinerary.flightSchedule : null,
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}

      {hasTimeline ? (
        <details className="details-block">
          <summary>Hotels</summary>
          <pre className="json-preview">
            {JSON.stringify(
              isHotelInventory(itinerary.hotelInventory) ? itinerary.hotelInventory : null,
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}

      {hasTimeline ? (
        <details className="details-block">
          <summary>Raw generation JSON</summary>
          <pre className="json-preview">
            {JSON.stringify(
              {
                flightSchedule: itinerary.flightSchedule,
                hotelInventory: itinerary.hotelInventory,
                sightseeingTimeline: itinerary.sightseeingTimeline,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
