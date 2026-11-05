import type { ItineraryGenerationContext } from "../context.js";

export const GENERATION_JSON_INSTRUCTIONS = `Return a single JSON object with exactly these keys:
searchParams, flightSchedule, hotelInventory, sightseeingTimeline.

Each object MUST include schemaVersion "1.0".

searchParams: destinationCountry, originCountry (ISO alpha-2), startDate, endDate (YYYY-MM-DD), travelerName, focusAreas (string array, min 1).

flightSchedule.segments: array with outbound and return legs. Each leg needs direction, carrier, flightNumber, origin, destination, departDate, departTime, arriveDate, arriveTime (times HH:MM 24h). Also include originAirport and destinationAirport as IATA 3-letter codes, bookingRef as a fake 6-character PNR (A-Z0-9), cabinClass (e.g. Economy), and optional seat/terminal. Use city or airport names for origin/destination labels — never raw ISO country codes as endpoints when airports are known. Invent plausible illustrative flights only (not real bookings).

hotelInventory.hotels: at least one hotel with name, city, checkIn, checkOut, starRating (1-5), nightlyRateUsd. Invent plausible illustrative hotels only.

sightseeingTimeline.days: at least one day; each day has date, theme, items (startTime, endTime, title, place, category one of culture|food|nature|transit|rest). Items on the same day must not overlap. First-day activities must start after 16:00 local to allow inbound flight arrival.

Do not include markdown or commentary — JSON only.`;

export function buildGenerationPrompt(
  context: ItineraryGenerationContext,
  options?: { userPlanPrompt?: string },
): string {
  const planBlock = options?.userPlanPrompt?.trim()
    ? `\nTraveler plan notes (honor intent; still invent illustrative flights/hotels/days):\n${options.userPlanPrompt.trim()}\n`
    : "";

  return `Generate an embassy-style open-mode travel packet for:
- Traveler: ${context.travelerName}
- Origin country: ${context.originCountry}
- Destination country: ${context.destinationCountry}
- Trip dates: ${context.startDate} to ${context.endDate}
${planBlock}
${GENERATION_JSON_INSTRUCTIONS}`;
}
