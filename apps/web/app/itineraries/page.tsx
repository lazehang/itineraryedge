import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listItineraries } from "@/lib/core-api";
import { ItineraryListByEmail } from "./ItineraryListByEmail";

export const metadata: Metadata = {
  title: "My itineraries",
};

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ItinerariesPage({ searchParams }: PageProps) {
  const { email: rawEmail } = await searchParams;
  const email = rawEmail?.trim().toLowerCase();

  const itineraries = email ? await listItineraries(email) : [];

  return (
    <main id="main" className="main--narrow">
      <div className="page-kicker">
        <p className="eyebrow">Saved drafts</p>
        <Link href="/itineraries/new" className="btn btn-secondary">
          New itinerary
        </Link>
      </div>
      <h1>My itineraries</h1>
      <p className="lede muted">Look up drafts saved under your email address.</p>

      <section className="sheet stack" style={{ marginTop: "var(--space-l)" }}>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <ItineraryListByEmail />
        </Suspense>
      </section>

      {email ? (
        <section className="stack" style={{ marginTop: "var(--space-xl)" }}>
          <p className="eyebrow">Results for {email}</p>
          {itineraries.length === 0 ? (
            <p className="muted">
              No itineraries yet.{" "}
              <Link href="/itineraries/new">Create your first draft</Link>.
            </p>
          ) : (
            <ul className="itinerary-list">
              {itineraries.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/itineraries/${item.id}?email=${encodeURIComponent(email)}`}
                    className="itinerary-list__link"
                  >
                    <span className="itinerary-list__title">{item.title}</span>
                    <span className="muted itinerary-list__meta">
                      {item.destinationCountry ?? "—"} · updated{" "}
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p className="page-links">
        <Link href="/">Home</Link>
      </p>
    </main>
  );
}
