import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";
import { PDFDocument, rgb } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER } from "./disclaimer.js";
import {
  ACCENT,
  BAND,
  BAND_SOFT,
  CONTENT_WIDTH,
  embedPdfFonts,
  estimateGenerationJsonBytes,
  INK,
  MARGIN_X,
  MUTED,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  POLISHED_COVER_HEADLINE,
  POLISHED_DEMO_FOOTER,
  POLISHED_QR_PLACEHOLDER,
  RULE,
  TITLE_SIZE,
  WHITE,
  type WriterContext,
  drawHairline,
  newContentPage,
  paintPolishedPageChrome,
  sanitizeForPdf,
  writeBlank,
  writeEntryBlock,
  writeHeading,
  writeKeyValueGrid,
  writeLines,
  writeTimelineDay,
  wrapLine,
} from "./pdf-layout.js";
import { MAX_GENERATION_JSON_BYTES, type StandardPdfInput } from "./compile-standard-pdf.js";

export type PolishedPdfInput = StandardPdfInput;

export type CompilePolishedPdfResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; code: "PAYLOAD_TOO_LARGE" | "INVALID_INPUT"; message: string };

const DENSE_LINE_HEIGHT = 12;
const DENSE_FONT_SIZE = 9.5;
const DENSE_TOP_Y = 720;
const DENSE_BOTTOM_Y = 70;

function drawCoverPage(ctx: WriterContext, input: PolishedPdfInput): void {
  const stay = input.payload?.segments?.find((segment) => segment.kind === "stay");
  const dateRange =
    stay != null ? `${stay.startDate} - ${stay.endDate}` : "Dates on file with draft";

  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: WHITE,
  });

  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 160,
    width: PAGE_WIDTH,
    height: 160,
    color: BAND,
  });

  ctx.page.drawText("ItineraryEdge", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 48,
    size: 12,
    font: ctx.fontBold,
    color: WHITE,
  });

  ctx.page.drawText(sanitizeForPdf(POLISHED_COVER_HEADLINE), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 92,
    size: 22,
    font: ctx.fontBold,
    color: WHITE,
    maxWidth: CONTENT_WIDTH,
  });

  ctx.page.drawText(sanitizeForPdf("Prepared for visa application supporting documents"), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 118,
    size: 10,
    font: ctx.font,
    color: rgb(0.78, 0.84, 0.92),
  });

  ctx.page.drawText(sanitizeForPdf(input.title), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 200,
    size: TITLE_SIZE + 2,
    font: ctx.fontBold,
    color: INK,
    maxWidth: CONTENT_WIDTH,
  });

  ctx.page.drawText(
    sanitizeForPdf(
      `Destination ${input.destinationCountry ?? "—"}   |   Travel dates ${dateRange}`,
    ),
    {
      x: MARGIN_X,
      y: PAGE_HEIGHT - 228,
      size: 11,
      font: ctx.font,
      color: MUTED,
      maxWidth: CONTENT_WIDTH,
    },
  );

  const traveler = input.payload?.traveler.displayName ?? input.profileDisplayName ?? "—";
  const passport = input.payload?.traveler.passportCountry ?? "—";

  const metaTop = PAGE_HEIGHT - 280;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: metaTop - 78,
    width: CONTENT_WIDTH,
    height: 90,
    color: BAND_SOFT,
    borderColor: RULE,
    borderWidth: 0.75,
  });

  const metaRows: Array<[string, string]> = [
    ["Traveler", traveler],
    ["Passport", passport],
    ["Reference", input.itineraryId],
    ["Contact", input.profileEmail ?? "—"],
  ];

  let metaY = metaTop - 18;
  for (let index = 0; index < metaRows.length; index += 2) {
    const left = metaRows[index];
    const right = metaRows[index + 1];
    if (left) {
      ctx.page.drawText(left[0].toUpperCase(), {
        x: MARGIN_X + 14,
        y: metaY,
        size: 7.5,
        font: ctx.fontBold,
        color: MUTED,
      });
      ctx.page.drawText(sanitizeForPdf(left[1]), {
        x: MARGIN_X + 14,
        y: metaY - 14,
        size: 10,
        font: ctx.font,
        color: INK,
        maxWidth: CONTENT_WIDTH / 2 - 24,
      });
    }
    if (right) {
      const rightX = MARGIN_X + CONTENT_WIDTH / 2 + 4;
      ctx.page.drawText(right[0].toUpperCase(), {
        x: rightX,
        y: metaY,
        size: 7.5,
        font: ctx.fontBold,
        color: MUTED,
      });
      ctx.page.drawText(sanitizeForPdf(right[1]), {
        x: rightX,
        y: metaY - 14,
        size: 10,
        font: ctx.font,
        color: INK,
        maxWidth: CONTENT_WIDTH / 2 - 24,
      });
    }
    metaY -= 40;
  }

  const noticeY = 210;
  ctx.page.drawText("IMPORTANT", {
    x: MARGIN_X,
    y: noticeY + 52,
    size: 8,
    font: ctx.fontBold,
    color: ACCENT,
  });
  drawHairline(ctx.page, noticeY + 44);

  const disclaimerLines = wrapLine(
    `${PDF_PACKET_DISCLAIMER} ${ITINERARY_DISCLAIMER}`,
    ctx.font,
    9.5,
    CONTENT_WIDTH,
  );
  let dy = noticeY + 28;
  for (const line of disclaimerLines) {
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: dy,
      size: 9.5,
      font: ctx.font,
      color: MUTED,
    });
    dy -= 13;
  }

  const qrY = 88;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: qrY,
    width: 88,
    height: 88,
    borderColor: RULE,
    borderWidth: 1.25,
    color: BAND_SOFT,
  });
  ctx.page.drawText("QR", {
    x: MARGIN_X + 32,
    y: qrY + 40,
    size: 12,
    font: ctx.fontBold,
    color: MUTED,
  });
  ctx.page.drawText(sanitizeForPdf(POLISHED_QR_PLACEHOLDER), {
    x: MARGIN_X + 104,
    y: qrY + 48,
    size: 10,
    font: ctx.fontBold,
    color: INK,
    maxWidth: CONTENT_WIDTH - 104,
  });
  ctx.page.drawText(sanitizeForPdf(POLISHED_DEMO_FOOTER), {
    x: MARGIN_X + 104,
    y: qrY + 28,
    size: 9,
    font: ctx.font,
    color: MUTED,
    maxWidth: CONTENT_WIDTH - 104,
  });

  ctx.y = DENSE_BOTTOM_Y + 40;
}

export async function compilePolishedPdf(
  input: PolishedPdfInput,
): Promise<CompilePolishedPdfResult> {
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
  pdfDoc.setTitle(`${input.title} (polished)`);
  pdfDoc.setAuthor("ItineraryEdge");
  pdfDoc.setSubject(`${PDF_PACKET_DISCLAIMER} ${POLISHED_DEMO_FOOTER}`);
  pdfDoc.setKeywords([
    ITINERARY_DISCLAIMER,
    PDF_PACKET_DISCLAIMER,
    POLISHED_DEMO_FOOTER,
    POLISHED_COVER_HEADLINE,
    POLISHED_QR_PLACEHOLDER,
  ]);

  const { font, fontBold } = await embedPdfFonts(pdfDoc);

  const ctx: WriterContext = {
    pdfDoc,
    font,
    fontBold,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: DENSE_TOP_Y,
    lineHeight: DENSE_LINE_HEIGHT,
    topContentY: DENSE_TOP_Y,
    bottomContentY: DENSE_BOTTOM_Y,
    pageNumber: 0,
  };

  drawCoverPage(ctx, input);
  newContentPage(ctx, paintPolishedPageChrome);

  writeHeading(ctx, "Trip summary", paintPolishedPageChrome);
  writeKeyValueGrid(
    ctx,
    [
      ["Traveler", input.payload?.traveler.displayName ?? input.profileDisplayName ?? "—"],
      ["Passport", input.payload?.traveler.passportCountry ?? "—"],
      ["Destination", input.destinationCountry ?? "—"],
      ["Contact", input.profileEmail ?? "—"],
    ],
    paintPolishedPageChrome,
  );

  writeHeading(ctx, "Flights", paintPolishedPageChrome);
  for (const segment of input.flightSchedule.segments) {
    writeEntryBlock(
      ctx,
      `${segment.direction.toUpperCase()}  ·  ${segment.carrier} ${segment.flightNumber}`,
      [
        `${segment.origin} -> ${segment.destination}`,
        `Depart ${segment.departDate} ${segment.departTime}  |  Arrive ${segment.arriveDate} ${segment.arriveTime}`,
      ],
      paintPolishedPageChrome,
    );
  }

  writeHeading(ctx, "Hotels", paintPolishedPageChrome);
  for (const hotel of input.hotelInventory.hotels) {
    writeEntryBlock(
      ctx,
      `${hotel.name}  ·  ${hotel.city}`,
      [
        `${hotel.starRating}*  ·  USD ${hotel.nightlyRateUsd}/night`,
        `Stay ${hotel.checkIn} to ${hotel.checkOut}`,
      ],
      paintPolishedPageChrome,
    );
  }

  writeHeading(ctx, "Daily plan", paintPolishedPageChrome);
  for (const day of input.sightseeingTimeline.days) {
    writeTimelineDay(
      ctx,
      `${day.date}  —  ${day.theme}`,
      day.items.map(
        (item) => `${item.startTime}-${item.endTime}  ${item.title}  (${item.place})`,
      ),
      paintPolishedPageChrome,
    );
  }

  writeHeading(ctx, "Legal notice", paintPolishedPageChrome);
  writeLines(
    ctx,
    [ITINERARY_DISCLAIMER, PDF_PACKET_DISCLAIMER, POLISHED_DEMO_FOOTER],
    DENSE_FONT_SIZE,
    false,
    paintPolishedPageChrome,
    { color: MUTED },
  );
  writeBlank(ctx);

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
