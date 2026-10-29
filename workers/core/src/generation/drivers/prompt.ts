import type { ItineraryGenerationContext } from "../context.js";

export const GENERATION_JSON_INSTRUCTIONS = `Return a single JSON object with exactly these keys:
searchParams, flightSchedule, hotelInventory, sightseeingTimeline.

Each object MUST include schemaVersion "1.0".

searchParams: destinationCountry, originCountry (ISO alpha-2), startDate, endDate (YYYY-MM-DD), travelerName, focusAreas (string array, min 1).

flightSchedule.segments: array with outbound and return legs. Each leg needs direction, carrier, flightNumber, origin, destination, departDate, departTime, arriveDate, arriveTime (times HH:MM 24h).

hotelInventory.hotels: at least one hotel with name, city, checkIn, checkOut, starRating (1-5), nightlyRateUsd.

sightseeingTimeline.days: at least one day; each day has date, theme, items (startTime, endTime, title, place, category one of culture|food|nature|transit|rest). Items on the same day must not overlap. First-day activities must start after 16:00 local to allow inbound flight arrival.

Do not include markdown or commentary — JSON only.`;

export function buildGenerationPrompt(context: ItineraryGenerationContext): string {
  return `Generate an embassy-style open-mode travel packet for:
- Traveler: ${context.travelerName}
- Origin country: ${context.originCountry}
- Destination country: ${context.destinationCountry}
- Trip dates: ${context.startDate} to ${context.endDate}

${GENERATION_JSON_INSTRUCTIONS}`;
}
