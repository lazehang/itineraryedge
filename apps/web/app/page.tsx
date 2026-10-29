import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

export default function HomePage() {
  return (
    <main>
      <p className="badge">Iteration 2</p>
      <h1>Embassy-style travel schedules, without the visa confusion</h1>
      <p className="lede muted">
        ItineraryEdge helps you draft a clear single-destination travel itinerary packet on the
        edge — ready for your records and future PDF export. One traveler, email-based access, no
        payment flow in this iteration.
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
        <h2 className="section-title">What you get in Iteration 2</h2>
        <ul className="feature-list">
          <li>Save a draft tied to your email (no OTP in this MVP).</li>
          <li>Destination country mapped into your stay segment automatically.</li>
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
