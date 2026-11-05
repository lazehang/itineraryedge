import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TravelItinerary } from "@itineraryedge/shared";
import { TravelPacketCard } from "@/components/TravelPacketCard";
import { GenerateCard } from "@/components/GenerateCard";
import { isMockUnlockAllowedInWeb } from "@/lib/env";
import { getItinerary } from "@/lib/core-api";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string; checkout?: string }>;
};

export const metadata: Metadata = {
  title: "Itinerary",
};

export default async function ItineraryDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { email: rawEmail, checkout: rawCheckout } = await searchParams;
  const email = rawEmail?.trim().toLowerCase();
  const checkoutReturn =
    rawCheckout === "success" ? "success" : rawCheckout === "cancel" ? "cancel" : null;

  if (!email) {
    return (
      <main id="main" className="main--narrow">
        <p className="eyebrow">Itinerary</p>
        <h1>Email required</h1>
        <p className="lede muted">
          Open this draft with the same email address you used when saving.
        </p>
        <p className="page-links">
          <Link href="/itineraries">Look up by email</Link>
        </p>
      </main>
    );
  }

  const itinerary = await getItinerary(id, email);
  if (!itinerary) {
    notFound();
  }

  const payload = itinerary.payload as TravelItinerary | null;
  const stay = payload?.segments?.find((segment) => segment.kind === "stay");

  return (
    <main id="main" className="main--narrow">
      <div className="page-kicker">
        <p className="eyebrow">Draft itinerary</p>
        <span className="badge">{itinerary.destinationCountry ?? "—"}</span>
      </div>
      <h1>{itinerary.title}</h1>
      <p className="lede muted">
        {itinerary.destinationCountry ?? stay?.location ?? "—"} ·{" "}
        {payload?.traveler.displayName ?? "—"}
      </p>

      <section className="sheet stack" style={{ marginTop: "var(--space-l)" }}>
        <h2 className="section-title">Trip summary</h2>
        {stay ? (
          <dl className="detail-grid">
            <div>
              <dt>Stay</dt>
              <dd>{stay.label}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{stay.location ?? itinerary.destinationCountry}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>
                {stay.startDate} → {stay.endDate}
              </dd>
            </div>
            <div>
              <dt>Passport nationality</dt>
              <dd>{payload?.traveler.passportCountry ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">No stay segment in this draft yet.</p>
        )}
      </section>

      <GenerateCard itineraryId={itinerary.id} email={email} initialItinerary={itinerary} />

      <TravelPacketCard
        itineraryId={itinerary.id}
        email={email}
        initialUnlocked={itinerary.isPremiumUnlocked}
        destinationCountry={itinerary.destinationCountry}
        allowMockUnlock={isMockUnlockAllowedInWeb()}
        checkoutReturn={checkoutReturn}
        hasGeneration={Boolean(
          itinerary.flightSchedule &&
            itinerary.hotelInventory &&
            itinerary.sightseeingTimeline,
        )}
      />

      <p className="page-links">
        <Link href={`/itineraries?email=${encodeURIComponent(email)}`}>All itineraries</Link>
        {" · "}
        <Link href="/itineraries/new">New itinerary</Link>
      </p>
    </main>
  );
}
