import Link from "next/link";
import { PacketOutline } from "@/components/PacketOutline";
import { SampleItineraryGallery } from "@/components/SampleItineraryGallery";

export default function HomePage() {
  return (
    <main id="main" className="main--cover">
      <p className="trust-bar" role="note">
        Supporting travel paperwork only · Not a visa or consular decision
      </p>

      <section className="cover" aria-label="Introduction">
        <div className="cover__copy">
          <div className="cover__brand-row">
            <p className="cover__brand">ItineraryEdge</p>
            <span className="badge badge-ai">AI-assisted</span>
          </div>
          <h1 className="cover__title">
            Visa-ready itineraries, drafted with AI and exported as a clean PDF.
          </h1>
          <p className="cover__support">
            Describe your trip in plain language, generate illustrative flights, hotels, and a day
            plan with AI, then download a supporting PDF — plus a free sample flight coupon.
          </p>
          <div className="cta-row">
            <Link href="/itineraries/new" className="btn btn-primary">
              Plan a trip
            </Link>
            <Link href="/itineraries" className="btn btn-secondary">
              Open existing drafts
            </Link>
          </div>
        </div>
        <PacketOutline />
      </section>

      <SampleItineraryGallery />

      <section className="ai-panel" aria-labelledby="ai-title">
        <div className="ai-panel__head">
          <h2 id="ai-title" className="ai-panel__title">
            Built for AI-assisted paperwork
          </h2>
          <span className="badge badge-ai">Bring your own key</span>
        </div>
        <p className="ai-panel__body">
          Generation is optional and stays under your control. Use the built-in mock for a quick
          draft, or connect your own OpenAI / Anthropic key in this browser session — keys are never
          stored in our database.
        </p>
        <ul className="ai-features">
          <li>
            <strong>Structured output</strong>
            <span>Flights, hotels, and sightseeing as reviewable JSON — not a chat transcript.</span>
          </li>
          <li>
            <strong>Human review first</strong>
            <span>Edit and regenerate before you download anything for an application.</span>
          </li>
          <li>
            <strong>PDF for the file</strong>
            <span>Export a standard packet, or unlock a denser polished layout.</span>
          </li>
        </ul>
      </section>

      <section className="section section--split" aria-labelledby="scope-title">
        <div>
          <h2 id="scope-title" className="section__title">
            What this is
          </h2>
          <ul className="plain-list">
            <li>A draft itinerary tied to your email</li>
            <li>Optional AI schedule generation for flights, hotels, and daily plans</li>
            <li>A standard PDF after generation; optional polished layout after unlock</li>
          </ul>
        </div>
        <div>
          <h2 className="section__title">What this is not</h2>
          <ul className="plain-list">
            <li>Not a visa, e-visa, or embassy appointment</li>
            <li>Not immigration advice or a guarantee of entry</li>
            <li>Not a booking engine for tickets or hotels</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="steps-title">
        <h2 id="steps-title" className="section__title">
          How to use it
        </h2>
        <ol className="steps">
          <li>
            <strong>Enter trip details</strong>
            Traveler, passport nationality, destination, and dates.
          </li>
          <li>
            <strong>Generate with AI</strong>
            Run the mock generator, or use your own key for a live model response.
          </li>
          <li>
            <strong>Download the PDF</strong>
            Add it to your application file with your other supporting documents.
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="price-title">
        <h2 id="price-title" className="section__title">
          Pricing
        </h2>
        <p className="section__lede">
          Standard PDF is included after you generate a schedule. The polished layout is optional
          and priced by destination region (for example HK$70, €9, or $9 USD).
        </p>
      </section>
    </main>
  );
}
