"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { planItinerary } from "@/lib/core-api";
import { readByokKeyFromSession } from "@/lib/byok";

function fieldError(errors: Record<string, string> | undefined, key: string) {
  const message = errors?.[key];
  if (!message) return null;
  return (
    <p className="field-error" id={`plan-${key}-error`} role="alert">
      {message}
    </p>
  );
}

export function PlanItineraryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string> | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [draftLink, setDraftLink] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);

      const email = String(data.get("email") ?? "").trim();
      const prompt = String(data.get("prompt") ?? "").trim();
      const travelerName = String(data.get("travelerName") ?? "").trim();
      const passportNationality = String(data.get("passportNationality") ?? "").trim();
      const destinationCountry = String(data.get("destinationCountry") ?? "").trim();
      const startDate = String(data.get("startDate") ?? "").trim();
      const endDate = String(data.get("endDate") ?? "").trim();
      const title = String(data.get("title") ?? "").trim();

      setErrors(undefined);
      setFormError(null);
      setDraftLink(null);

      startTransition(() => {
        void (async () => {
          const result = await planItinerary(
            {
              email,
              prompt,
              ...(travelerName ? { travelerName } : {}),
              ...(passportNationality ? { passportNationality } : {}),
              ...(destinationCountry ? { destinationCountry } : {}),
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
              ...(title ? { title } : {}),
            },
            readByokKeyFromSession(),
          );

          if (!result.ok) {
            if (result.errors) {
              setErrors(result.errors);
              setDetailsOpen(true);
            }
            const detailParts = [result.message];
            if (result.details?.length) {
              detailParts.push(result.details.join(" "));
            }
            setFormError(detailParts.filter(Boolean).join(" "));
            // Draft may exist without a schedule — stay on form so the error is visible.
            if (result.itinerary) {
              const q = encodeURIComponent(email.toLowerCase());
              setDraftLink(`/itineraries/${result.itinerary.id}?email=${q}`);
            }
            return;
          }

          const q = encodeURIComponent(email.toLowerCase());
          router.push(`/itineraries/${result.itinerary.id}?email=${q}`);
        })();
      });
    },
    [router],
  );

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="plan-email">Email</label>
        <input
          id="plan-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={errors?.email ? "plan-email-error" : undefined}
          aria-invalid={Boolean(errors?.email)}
        />
        {fieldError(errors, "email")}
      </div>

      <div className="field">
        <label htmlFor="plan-prompt">Describe your trip</label>
        <textarea
          id="plan-prompt"
          name="prompt"
          rows={6}
          required
          minLength={12}
          placeholder="e.g. I am Alex Chen with a US passport, visiting Japan from 2026-06-01 to 2026-06-08 — culture, food, and one day trip outside Tokyo."
          aria-describedby={errors?.prompt ? "plan-prompt-error" : "plan-prompt-hint"}
          aria-invalid={Boolean(errors?.prompt)}
        />
        <p id="plan-prompt-hint" className="muted text-sm">
          Include traveler name, passport nationality, destination, and dates when you can. Flights
          and hotels are illustrative samples — not real bookings.
        </p>
        {fieldError(errors, "prompt")}
      </div>

      <details
        className="plan-details"
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
      >
        <summary>Optional details (if the prompt is ambiguous)</summary>
        <div className="stack" style={{ marginTop: "var(--space-s)" }}>
          <div className="field">
            <label htmlFor="plan-travelerName">Traveler name</label>
            <input id="plan-travelerName" name="travelerName" type="text" autoComplete="name" />
            {fieldError(errors, "travelerName")}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="plan-passportNationality">Passport (ISO alpha-2)</label>
              <input
                id="plan-passportNationality"
                name="passportNationality"
                type="text"
                maxLength={2}
                placeholder="US"
              />
              {fieldError(errors, "passportNationality")}
            </div>
            <div className="field">
              <label htmlFor="plan-destinationCountry">Destination (ISO alpha-2)</label>
              <input
                id="plan-destinationCountry"
                name="destinationCountry"
                type="text"
                maxLength={2}
                placeholder="JP"
              />
              {fieldError(errors, "destinationCountry")}
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="plan-startDate">Start date</label>
              <input id="plan-startDate" name="startDate" type="date" />
              {fieldError(errors, "startDate")}
            </div>
            <div className="field">
              <label htmlFor="plan-endDate">End date</label>
              <input id="plan-endDate" name="endDate" type="date" />
              {fieldError(errors, "endDate")}
            </div>
          </div>
          <div className="field">
            <label htmlFor="plan-title">
              Trip title <span className="muted">(optional)</span>
            </label>
            <input id="plan-title" name="title" type="text" maxLength={200} />
            {fieldError(errors, "title")}
          </div>
        </div>
      </details>

      {formError ? (
        <div className="error-panel" role="alert">
          <strong>Could not plan trip</strong>
          <p>{formError}</p>
          {draftLink ? (
            <p className="text-sm">
              A draft was saved without a generated schedule.{" "}
              <Link href={draftLink}>Open draft</Link> to generate later, or fix the fields above and
              try again.
            </p>
          ) : null}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Planning itinerary…" : "Create & generate schedule"}
      </button>
      <p className="muted text-sm">
        Uses the mock driver locally, or your session BYOK key when set. This can take a moment.
      </p>
    </form>
  );
}
