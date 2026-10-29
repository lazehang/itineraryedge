import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";

const coreHealthUrl =
  process.env.NEXT_PUBLIC_CORE_WORKER_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8787";

export default function HomePage() {
  return (
    <main>
      <p className="badge">Iteration 1</p>
      <h1>ItineraryEdge</h1>
      <p className="muted">
        Open-core edge visa itinerary engine — generate embassy-style travel schedules and
        downloadable PDF packets on Cloudflare (Pages + Workers + D1).
      </p>

      <section className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Web shell</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          This App Router app is the Cloudflare Pages front end. Worker A exposes{" "}
          <code>/health</code> for connectivity checks (
          <a href={`${coreHealthUrl}/health`} rel="noreferrer">
            {coreHealthUrl}/health
          </a>
          ).
        </p>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Disclaimer</h2>
        <p style={{ marginBottom: 0 }}>{ITINERARY_DISCLAIMER}</p>
      </section>
    </main>
  );
}
