import {
  ITINERARY_DISCLAIMER,
  type GenerationFlightSchedule,
  type GenerationHotelInventory,
  type GenerationSightseeingTimeline,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { PDFDocument } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER } from "./disclaimer.js";
import {
  embedPdfFonts,
  estimateGenerationJsonBytes,
  FONT_SIZE,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  paintStandardPageChrome,
  TITLE_SIZE,
  TOP_CONTENT_Y,
  type WriterContext,
  writeBlank,
  writeHeading,
  writeLines,
} from "./pdf-layout.js";

export const MAX_GENERATION_JSON_BYTES = 512 * 1024;

export type StandardPdfInput = {
  itineraryId: string;
  title: string;
  destinationCountry: string | null;
  profileEmail: string | null;
  profileDisplayName: string | null;
  payload: TravelItinerary | null;
  flightSchedule: GenerationFlightSchedule;
  hotelInventory: GenerationHotelInventory;
  sightseeingTimeline: GenerationSightseeingTimeline;
};

export type CompileStandardPdfResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; code: "PAYLOAD_TOO_LARGE" | "INVALID_INPUT"; message: string };

export async function compileStandardPdf(
  input: StandardPdfInput,
): Promise<CompileStandardPdfResult> {
  const generationBytes = estimateGenerationJsonBytes([
    input.flightSchedule,
    input.hotelInventory,
    input.sightseeingTimeline,
  ]);
  if (generationBytes > MAX_GENERATION_JSON_BYTES) {
    return {
      ok: false,
      code: "PAYLOAD_TOO_LARGE",
      message: `Generation JSON exceeds ${MAX_GENERATION_JSON_BYTES} bytes.`,
    };
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(input.title);
  pdfDoc.setAuthor("ItineraryEdge");
  pdfDoc.setSubject(PDF_PACKET_DISCLAIMER);
  pdfDoc.setKeywords([ITINERARY_DISCLAIMER, PDF_PACKET_DISCLAIMER]);

  const { font, fontBold } = await embedPdfFonts(pdfDoc);

  const ctx: WriterContext = {
    pdfDoc,
    font,
    fontBold,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: TOP_CONTENT_Y,
  };

  paintStandardPageChrome(ctx);

  writeLines(ctx, [input.title], TITLE_SIZE, true);
  writeBlank(ctx);
  writeLines(ctx, [
    `Itinerary ID: ${input.itineraryId}`,
    `Destination: ${input.destinationCountry ?? "—"}`,
    `Traveler: ${input.payload?.traveler.displayName ?? input.profileDisplayName ?? "—"}`,
    `Passport nationality: ${input.payload?.traveler.passportCountry ?? "—"}`,
    `Profile email: ${input.profileEmail ?? "—"}`,
  ]);

  const stay = input.payload?.segments?.find((segment) => segment.kind === "stay");
  if (stay) {
    writeHeading(ctx, "Trip stay (from draft payload)");
    writeLines(ctx, [
      `${stay.label} · ${stay.location ?? input.destinationCountry ?? "—"}`,
      `Dates: ${stay.startDate} → ${stay.endDate}`,
    ]);
  }

  writeHeading(ctx, "Flights");
  for (const segment of input.flightSchedule.segments) {
    writeLines(ctx, [
      `${segment.direction.toUpperCase()} · ${segment.carrier} ${segment.flightNumber}`,
      `${segment.origin} → ${segment.destination}`,
      `Depart ${segment.departDate} ${segment.departTime} · Arrive ${segment.arriveDate} ${segment.arriveTime}`,
    ]);
    writeBlank(ctx);
  }

  writeHeading(ctx, "Hotels");
  for (const hotel of input.hotelInventory.hotels) {
    writeLines(ctx, [
      `${hotel.name} (${hotel.starRating}★) · ${hotel.city}`,
      `Check-in ${hotel.checkIn} · Check-out ${hotel.checkOut}`,
      `Indicative nightly rate: USD ${hotel.nightlyRateUsd}`,
    ]);
    writeBlank(ctx);
  }

  writeHeading(ctx, "Sightseeing timeline");
  for (const day of input.sightseeingTimeline.days) {
    writeLines(ctx, [`${day.date} — ${day.theme}`], FONT_SIZE, true);
    for (const item of day.items) {
      writeLines(ctx, [
        `  ${item.startTime}–${item.endTime} · ${item.title} @ ${item.place} (${item.category})`,
      ]);
    }
    writeBlank(ctx);
  }

  writeHeading(ctx, "Legal notice");
  writeLines(ctx, [ITINERARY_DISCLAIMER, PDF_PACKET_DISCLAIMER]);

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
