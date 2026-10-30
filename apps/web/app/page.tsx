import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function HomePage() {
  return (
    <main>
      <p className="badge">Work in progress</p>
      <h1>Embassy-style travel schedules, without the visa confusion</h1>
      <p className="lede muted">
        ItineraryEdge helps you draft a single-destination travel itinerary on the edge, optionally
        generate flight/hotel/sightseeing JSON, and download a travel-packet PDF. Unlock a polished
        PDF with staging demo unlock or paid checkout via the private billing worker (Stripe test).
        APIs and UI may change — not production-ready.
      </p>

      <div className="cta-row">
        <Link href="/itineraries/new" className="btn btn-primary">
          Create itinerary draft
        </Link>
        <Link href="/itineraries" className="btn btn-secondary">
          View my itineraries
        </Link>
      </div>

      <section className="card stack" style={{ marginTop: "2rem" }}>
        <h2 className="section-title">What you get in this MVP</h2>
        <ul className="feature-list">
          <li>Save a draft tied to your email (no OTP in this MVP).</li>
          <li>Optional AI generation (BYOK or mock driver) for flights, hotels, and sightseeing.</li>
          <li>Standard travel-packet PDF; polished PDF after unlock (mock locally/staging, or paid via billing).</li>
          <li>List and reopen drafts from any device using the same email.</li>
        </ul>
      </section>

      <section className="card stack" style={{ marginTop: "1rem" }}>
        <h2 className="section-title">Disclaimer</h2>
        <Disclaimer />
      </section>
    </main>
  );
}
