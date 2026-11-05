import {
  FLIGHT_TICKET_BANNER,
  FLIGHT_TICKET_DISCLAIMER,
  type FlightSegment,
  type GenerationFlightSchedule,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { PDF_TICKET_HEADER } from "./disclaimer.js";
import {
  CONTENT_WIDTH,
  embedPdfFonts,
  FONT_SIZE,
  INK,
  MARGIN_X,
  MUTED,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  RULE,
  sanitizeForPdf,
  TITLE_SIZE,
  WHITE,
  wrapLine,
} from "./pdf-layout.js";

export type FlightTicketLegFilter = "outbound" | "return" | "all";

export type FlightTicketPdfInput = {
  itineraryId: string;
  title: string;
  profileEmail: string | null;
  profileDisplayName: string | null;
  payload: TravelItinerary | null;
  flightSchedule: GenerationFlightSchedule;
  leg?: FlightTicketLegFilter;
};

export type CompileFlightTicketPdfResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; code: "NO_SEGMENTS" | "INVALID_INPUT"; message: string };

const WARN = rgb(0.72, 0.18, 0.14);
const COUPON_BAND = rgb(0.16, 0.2, 0.28);
const COUPON_FILL = rgb(0.97, 0.97, 0.98);

function selectSegments(
  schedule: GenerationFlightSchedule,
  leg: FlightTicketLegFilter,
): FlightSegment[] {
  if (leg === "all") {
    return schedule.segments;
  }
  return schedule.segments.filter((segment) => segment.direction === leg);
}

function drawCouponPage(
  pdfDoc: PDFDocument,
  fonts: { font: PDFFont; fontBold: PDFFont },
  input: {
    travelerName: string;
    email: string;
    segment: FlightSegment;
    pageIndex: number;
    pageCount: number;
  },
): void {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { font, fontBold } = fonts;

  // Header strip
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 56,
    width: PAGE_WIDTH,
    height: 56,
    color: COUPON_BAND,
  });
  page.drawText(sanitizeForPdf(PDF_TICKET_HEADER), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 28,
    size: 10,
    font: fontBold,
    color: WHITE,
  });
  page.drawText(sanitizeForPdf(`Sample coupon ${input.pageIndex}/${input.pageCount}`), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 44,
    size: 8,
    font,
    color: rgb(0.75, 0.78, 0.84),
  });

  // NOT A VALID TICKET banner
  const bannerY = PAGE_HEIGHT - 96;
  page.drawRectangle({
    x: MARGIN_X,
    y: bannerY - 6,
    width: CONTENT_WIDTH,
    height: 28,
    color: WARN,
  });
  const banner = sanitizeForPdf(FLIGHT_TICKET_BANNER);
  const bannerWidth = fontBold.widthOfTextAtSize(banner, 12);
  page.drawText(banner, {
    x: MARGIN_X + (CONTENT_WIDTH - bannerWidth) / 2,
    y: bannerY + 4,
    size: 12,
    font: fontBold,
    color: WHITE,
  });

  let y = bannerY - 40;
  page.drawText(sanitizeForPdf("Illustrative flight coupon"), {
    x: MARGIN_X,
    y,
    size: TITLE_SIZE,
    font: fontBold,
    color: INK,
  });
  y -= 22;

  for (const line of wrapLine(FLIGHT_TICKET_DISCLAIMER, font, FONT_SIZE, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN_X, y, size: FONT_SIZE, font, color: MUTED });
    y -= 14;
  }
  y -= 10;

  // Coupon card
  const cardTop = y + 8;
  const cardHeight = 280;
  page.drawRectangle({
    x: MARGIN_X,
    y: cardTop - cardHeight,
    width: CONTENT_WIDTH,
    height: cardHeight,
    color: COUPON_FILL,
    borderColor: RULE,
    borderWidth: 1,
  });

  const seg = input.segment;
  // Never invent IATA from city name prefixes (e.g. "New York" → "NEW").
  const originCode = seg.originAirport?.toUpperCase() || "---";
  const destCode = seg.destinationAirport?.toUpperCase() || "---";
  const bookingRef = seg.bookingRef ?? "SAMPLE";

  let cy = cardTop - 28;
  page.drawText(sanitizeForPdf("SAMPLE CARRIER — NOT AFFILIATED WITH ANY AIRLINE"), {
    x: MARGIN_X + 16,
    y: cy,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  cy -= 22;

  page.drawText(sanitizeForPdf(`Passenger: ${input.travelerName}`), {
    x: MARGIN_X + 16,
    y: cy,
    size: 11,
    font: fontBold,
    color: INK,
  });
  cy -= 16;
  if (input.email) {
    page.drawText(sanitizeForPdf(`Contact: ${input.email}`), {
      x: MARGIN_X + 16,
      y: cy,
      size: 9,
      font,
      color: MUTED,
    });
    cy -= 18;
  } else {
    cy -= 4;
  }

  page.drawText(sanitizeForPdf(`Booking ref (fake PNR): ${bookingRef}`), {
    x: MARGIN_X + 16,
    y: cy,
    size: 11,
    font: fontBold,
    color: INK,
  });
  cy -= 28;

  // Route codes
  const routeSize = 28;
  page.drawText(sanitizeForPdf(originCode), {
    x: MARGIN_X + 16,
    y: cy,
    size: routeSize,
    font: fontBold,
    color: INK,
  });
  page.drawText("->", {
    x: MARGIN_X + 110,
    y: cy + 6,
    size: 16,
    font: fontBold,
    color: MUTED,
  });
  page.drawText(sanitizeForPdf(destCode), {
    x: MARGIN_X + 150,
    y: cy,
    size: routeSize,
    font: fontBold,
    color: INK,
  });
  cy -= 22;

  page.drawText(
    sanitizeForPdf(`${seg.origin}  to  ${seg.destination}`),
    { x: MARGIN_X + 16, y: cy, size: 10, font, color: MUTED },
  );
  cy -= 24;

  const rows: Array<[string, string]> = [
    ["Direction", seg.direction],
    ["Flight", `${seg.carrier} ${seg.flightNumber}`],
    ["Depart", `${seg.departDate}  ${seg.departTime}`],
    ["Arrive", `${seg.arriveDate}  ${seg.arriveTime}`],
    ["Cabin", seg.cabinClass ?? "Economy (sample)"],
    ["Seat", seg.seat ?? "Unassigned (sample)"],
    ["Terminal", seg.terminal ?? "—"],
  ];

  for (const [label, value] of rows) {
    page.drawText(sanitizeForPdf(label), {
      x: MARGIN_X + 16,
      y: cy,
      size: 9,
      font: fontBold,
      color: MUTED,
    });
    page.drawText(sanitizeForPdf(value), {
      x: MARGIN_X + 120,
      y: cy,
      size: 10,
      font,
      color: INK,
    });
    cy -= 16;
  }

  // Footer disclaimer
  let fy = 56;
  page.drawLine({
    start: { x: MARGIN_X, y: fy + 20 },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: fy + 20 },
    thickness: 0.5,
    color: RULE,
  });
  for (const line of wrapLine(
    "This document is generated for illustrative / supporting paperwork only. It is not a valid ticket, boarding pass, reservation, or visa document.",
    font,
    8,
    CONTENT_WIDTH,
  )) {
    page.drawText(line, { x: MARGIN_X, y: fy, size: 8, font, color: MUTED });
    fy -= 11;
  }
}

export async function compileFlightTicketPdf(
  input: FlightTicketPdfInput,
): Promise<CompileFlightTicketPdfResult> {
  const leg = input.leg ?? "all";
  const segments = selectSegments(input.flightSchedule, leg);
  if (segments.length === 0) {
    return {
      ok: false,
      code: "NO_SEGMENTS",
      message: `No ${leg === "all" ? "flight" : leg} segments available for ticket PDF.`,
    };
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${input.title} — sample flight coupon`);
  pdfDoc.setAuthor("ItineraryEdge");
  pdfDoc.setSubject(FLIGHT_TICKET_DISCLAIMER);
  pdfDoc.setKeywords([FLIGHT_TICKET_BANNER, FLIGHT_TICKET_DISCLAIMER]);

  const fonts = await embedPdfFonts(pdfDoc);
  const travelerName =
    input.payload?.traveler.displayName ??
    input.profileDisplayName ??
    "Traveler";
  const email = input.profileEmail ?? "";

  segments.forEach((segment, index) => {
    drawCouponPage(pdfDoc, fonts, {
      travelerName,
      email,
      segment,
      pageIndex: index + 1,
      pageCount: segments.length,
    });
  });

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
