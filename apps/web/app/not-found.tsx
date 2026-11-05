import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="main--narrow not-found">
      <p className="not-found__code">Page not found</p>
      <h1>This page is not available</h1>
      <p className="lede muted">
        The link may be incorrect, or the itinerary may have been removed. You can start a new draft
        or look up existing ones by email.
      </p>
      <div className="cta-row">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/itineraries/new" className="btn btn-secondary">
          New itinerary
        </Link>
      </div>
    </main>
  );
}
