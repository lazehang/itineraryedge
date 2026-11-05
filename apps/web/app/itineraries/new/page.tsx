import type { Metadata } from "next";
import Link from "next/link";
import { PlanItineraryForm } from "./PlanItineraryForm";

export const metadata: Metadata = {
  title: "New itinerary",
};

type Props = {
  searchParams: Promise<{ manual?: string }>;
};

export default async function NewItineraryPage({ searchParams }: Props) {
  const params = await searchParams;
  const manual = params.manual === "1" || params.manual === "true";

  if (manual) {
    const { CreateItineraryForm } = await import("./CreateItineraryForm");
    return (
      <main id="main" className="main--narrow">
        <p className="eyebrow">New itinerary</p>
        <h1>Manual trip details</h1>
        <p className="lede muted">
          Enter structured fields for a draft only. You can generate the schedule on the detail
          page afterward.
        </p>

        <section className="sheet stack" style={{ marginTop: "var(--space-l)" }}>
          <CreateItineraryForm />
        </section>

        <p className="page-links">
          <Link href="/itineraries/new">Back to prompt planning</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
      </main>
    );
  }

  return (
    <main id="main" className="main--narrow">
      <p className="eyebrow">New itinerary</p>
      <h1>Describe your trip</h1>
      <p className="lede muted">
        Tell us where you&apos;re going in plain language. We&apos;ll draft an illustrative schedule
        (flights, hotels, days) you can review and download as supporting paperwork — not a visa or
        real ticket.
      </p>

      <section className="sheet stack" style={{ marginTop: "var(--space-l)" }}>
        <PlanItineraryForm />
      </section>

      <p className="page-links">
        Prefer the structured form?{" "}
        <Link href="/itineraries/new?manual=1">Enter details manually</Link>
        {" · "}
        <Link href="/">Home</Link>
      </p>
    </main>
  );
}
