import { FLIGHT_TICKET_BANNER, FLIGHT_TICKET_DISCLAIMER } from "@itineraryedge/shared";

/** Visible on every standard-mode PDF page (header + footer). */
export const PDF_PACKET_HEADER =
  "ItineraryEdge — supporting travel packet (standard mode)" as const;

export const PDF_PACKET_DISCLAIMER =
  "Supporting travel packet only — not a visa, not an official consular document, and not a guarantee of entry." as const;

export { FLIGHT_TICKET_BANNER, FLIGHT_TICKET_DISCLAIMER };

export const PDF_TICKET_HEADER =
  "ItineraryEdge — illustrative flight coupon (sample only)" as const;
