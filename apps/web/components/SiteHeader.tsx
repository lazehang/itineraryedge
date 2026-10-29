import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo">
          ItineraryEdge
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/itineraries/new">Create</Link>
          <Link href="/itineraries">My itineraries</Link>
        </nav>
      </div>
    </header>
  );
}
