import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={className ?? "disclaimer"} role="note">
      {ITINERARY_DISCLAIMER}
    </p>
  );
}
