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
  CONTENT_WIDTH,
  embedPdfFonts,
  estimateGenerationJsonBytes,
  INK,
  MARGIN_X,
  MUTED,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  paintStandardPageChrome,
  TITLE_SIZE,
  TOP_CONTENT_Y,
  type WriterContext,
  writeBlank,
  writeEntryBlock,
  writeHeading,
  writeInfoCard,
  writeKeyValueGrid,
  writeLines,
  writeTimelineDay,
  sanitizeForPdf,
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
    pageNumber: 0,
  };

  paintStandardPageChrome(ctx);

  const title = sanitizeForPdf(input.title);
  ctx.page.drawText(title, {
    x: MARGIN_X,
    y: ctx.y,
    size: TITLE_SIZE,
    font: ctx.fontBold,
    color: INK,
    maxWidth: CONTENT_WIDTH,
  });
  ctx.y -= 28;

  ctx.page.drawText(sanitizeForPdf("Prepared as supporting travel paperwork"), {
    x: MARGIN_X,
    y: ctx.y,
    size: 9,
    font: ctx.font,
    color: MUTED,
  });
  ctx.y -= 18;

  writeKeyValueGrid(ctx, [
    ["Traveler", input.payload?.traveler.displayName ?? input.profileDisplayName ?? "—"],
    ["Passport nationality", input.payload?.traveler.passportCountry ?? "—"],
    ["Destination", input.destinationCountry ?? "—"],
    ["Reference ID", input.itineraryId],
    ["Contact email", input.profileEmail ?? "—"],
    ["Document type", "Standard travel schedule packet"],
  ]);

  const stay = input.payload?.segments?.find((segment) => segment.kind === "stay");
  if (stay) {
    writeHeading(ctx, "Trip overview");
    writeInfoCard(ctx, [
      `${stay.label} · ${stay.location ?? input.destinationCountry ?? "—"}`,
      `Travel dates: ${stay.startDate} to ${stay.endDate}`,
    ]);
  }

  writeHeading(ctx, "Flight schedule");
  for (const segment of input.flightSchedule.segments) {
    writeEntryBlock(
      ctx,
      `${segment.direction.toUpperCase()}  ·  ${segment.carrier} ${segment.flightNumber}`,
      [
        `Route: ${segment.origin} -> ${segment.destination}`,
        `Depart: ${segment.departDate} ${segment.departTime}`,
        `Arrive: ${segment.arriveDate} ${segment.arriveTime}`,
      ],
    );
  }

  writeHeading(ctx, "Hotel accommodation");
  for (const hotel of input.hotelInventory.hotels) {
    writeEntryBlock(
      ctx,
      `${hotel.name}  ·  ${hotel.city}`,
      [
        `Category: ${hotel.starRating}*`,
        `Check-in ${hotel.checkIn}  |  Check-out ${hotel.checkOut}`,
        `Indicative nightly rate: USD ${hotel.nightlyRateUsd}`,
      ],
    );
  }

  writeHeading(ctx, "Daily plan");
  for (const day of input.sightseeingTimeline.days) {
    writeTimelineDay(
      ctx,
      `${day.date}  —  ${day.theme}`,
      day.items.map(
        (item) =>
          `${item.startTime}-${item.endTime}  ${item.title}  @ ${item.place} (${item.category})`,
      ),
    );
  }

  writeHeading(ctx, "Important notice");
  writeLines(ctx, [ITINERARY_DISCLAIMER], 9, false, paintStandardPageChrome, { color: MUTED });
  writeBlank(ctx);
  writeLines(ctx, [PDF_PACKET_DISCLAIMER], 9, false, paintStandardPageChrome, { color: MUTED });

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
