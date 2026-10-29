import Link from "next/link";
import { Suspense } from "react";
import { listItineraries } from "@/lib/core-api";
import { ItineraryListByEmail } from "./ItineraryListByEmail";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ItinerariesPage({ searchParams }: PageProps) {
  const { email: rawEmail } = await searchParams;
  const email = rawEmail?.trim().toLowerCase();

  const itineraries = email ? await listItineraries(email) : [];

  return (
    <main>
      <p className="badge">Your drafts</p>
      <h1>Itineraries</h1>
      <p className="lede muted">
        Look up drafts saved under your email. Create a new itinerary anytime.
      </p>

      <section className="card stack" style={{ marginTop: "1.5rem" }}>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <ItineraryListByEmail />
        </Suspense>
      </section>

      {email ? (
        <section className="stack" style={{ marginTop: "1.5rem" }}>
          <h2 className="section-title">Results for {email}</h2>
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
                    className="itinerary-list__link card"
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

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href="/itineraries/new">Create itinerary</Link> · <Link href="/">Home</Link>
      </p>
    </main>
  );
}
