import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { CreateItineraryForm } from "./CreateItineraryForm";

export default function NewItineraryPage() {
  return (
    <main>
      <p className="badge">Create draft</p>
      <h1>New travel itinerary</h1>
      <p className="lede muted">
        Single-traveler MVP — your email identifies your profile. No verification step in this
        iteration.
      </p>

      <section className="card stack" style={{ marginTop: "1.5rem" }}>
        <CreateItineraryForm />
      </section>

      <section className="card stack" style={{ marginTop: "1rem" }}>
        <h2 className="section-title">Disclaimer</h2>
        <Disclaimer />
      </section>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
