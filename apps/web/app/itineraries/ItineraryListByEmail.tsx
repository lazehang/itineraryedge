"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ItineraryListByEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    router.push(`/itineraries?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="list-email">Email</label>
        <input
          id="list-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-secondary">
        Show my itineraries
      </button>
    </form>
  );
}
