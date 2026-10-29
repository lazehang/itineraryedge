import Link from "next/link";
import { notFound } from "next/navigation";
import type { TravelItinerary } from "@itineraryedge/shared";
import { Disclaimer } from "@/components/Disclaimer";
import { GenerateCard } from "@/components/GenerateCard";
import { getItinerary } from "@/lib/core-api";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default async function ItineraryDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { email: rawEmail } = await searchParams;
  const email = rawEmail?.trim().toLowerCase();

  if (!email) {
    return (
      <main>
        <h1>Itinerary detail</h1>
        <p className="muted">
          Add your <code>?email=</code> query parameter (same email used when saving) to view this
          draft.
        </p>
        <p>
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
    <main>
      <p className="badge">Draft</p>
      <h1>{itinerary.title}</h1>
      <p className="lede muted">
        Destination {itinerary.destinationCountry ?? stay?.location ?? "—"} · traveler{" "}
        {payload?.traveler.displayName ?? "—"}
      </p>

      <section className="card stack" style={{ marginTop: "1.5rem" }}>
        <h2 className="section-title">Schedule</h2>
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
          <p className="muted">No stay segment in payload.</p>
        )}
      </section>

      <GenerateCard itineraryId={itinerary.id} email={email} initialItinerary={itinerary} />

      <section className="card stack" style={{ marginTop: "1rem" }}>
        <h2 className="section-title">Disclaimer</h2>
        <Disclaimer />
      </section>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href={`/itineraries?email=${encodeURIComponent(email)}`}>All itineraries</Link> ·{" "}
        <Link href="/itineraries/new">Create another</Link>
      </p>
    </main>
  );
}
