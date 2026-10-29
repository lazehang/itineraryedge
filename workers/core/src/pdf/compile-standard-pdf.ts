import {
  ITINERARY_DISCLAIMER,
  type GenerationFlightSchedule,
  type GenerationHotelInventory,
  type GenerationSightseeingTimeline,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER, PDF_PACKET_HEADER } from "./disclaimer.js";

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

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 50;
const TOP_CONTENT_Y = 720;
const BOTTOM_CONTENT_Y = 72;
const LINE_HEIGHT = 13;
const FONT_SIZE = 10;
const HEADER_SIZE = 9;
const TITLE_SIZE = 16;

function sanitizeForPdf(text: string): string {
  return text
    .replaceAll("→", "->")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("★", "*");
}

function estimateGenerationBytes(input: StandardPdfInput): number {
  return (
    JSON.stringify(input.flightSchedule).length +
    JSON.stringify(input.hotelInventory).length +
    JSON.stringify(input.sightseeingTimeline).length
  );
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeForPdf(text);
  const words = safe.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = words[0] ?? "";

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index] ?? "";
    const candidate = `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

type WriterContext = {
  pdfDoc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
};

function drawFooter(ctx: WriterContext): void {
  const footerY = 36;
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: footerY,
    size: HEADER_SIZE,
    font: ctx.font,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    lineHeight: LINE_HEIGHT,
  });
}

function paintPageChrome(ctx: WriterContext): void {
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_HEADER), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 40,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
  });
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 54,
    size: HEADER_SIZE - 1,
    font: ctx.font,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    lineHeight: LINE_HEIGHT,
  });
  drawFooter(ctx);
}

function newPage(ctx: WriterContext): void {
  ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = TOP_CONTENT_Y;
  paintPageChrome(ctx);
}

function ensureSpace(ctx: WriterContext, linesNeeded: number): void {
  if (ctx.y - linesNeeded * LINE_HEIGHT < BOTTOM_CONTENT_Y) {
    newPage(ctx);
  }
}

function writeLines(ctx: WriterContext, lines: string[], size = FONT_SIZE, bold = false): void {
  const font = bold ? ctx.fontBold : ctx.font;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;

  for (const raw of lines) {
    const wrapped = wrapLine(sanitizeForPdf(raw), font, size, maxWidth);
    for (const line of wrapped) {
      ensureSpace(ctx, 1);
      ctx.page.drawText(line, { x: MARGIN_X, y: ctx.y, size, font });
      ctx.y -= LINE_HEIGHT;
    }
  }
}

function writeHeading(ctx: WriterContext, text: string): void {
  ensureSpace(ctx, 2);
  ctx.y -= 4;
  writeLines(ctx, [text], FONT_SIZE + 2, true);
  ctx.y -= 2;
}

function writeBlank(ctx: WriterContext): void {
  ctx.y -= LINE_HEIGHT;
}

export async function compileStandardPdf(
  input: StandardPdfInput,
): Promise<CompileStandardPdfResult> {
  const generationBytes = estimateGenerationBytes(input);
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

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ctx: WriterContext = {
    pdfDoc,
    font,
    fontBold,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: TOP_CONTENT_Y,
  };

  paintPageChrome(ctx);

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
