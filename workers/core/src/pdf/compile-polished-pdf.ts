import { ITINERARY_DISCLAIMER } from "@itineraryedge/shared";
import { PDFDocument, rgb } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER } from "./disclaimer.js";
import {
  embedPdfFonts,
  estimateGenerationJsonBytes,
  FONT_SIZE,
  MARGIN_X,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  POLISHED_COVER_HEADLINE,
  POLISHED_DEMO_FOOTER,
  POLISHED_QR_PLACEHOLDER,
  sanitizeForPdf,
  TITLE_SIZE,
  type WriterContext,
  newContentPage,
  paintPolishedPageChrome,
  writeBlank,
  writeHeading,
  writeLines,
} from "./pdf-layout.js";
import { MAX_GENERATION_JSON_BYTES, type StandardPdfInput } from "./compile-standard-pdf.js";

export type PolishedPdfInput = StandardPdfInput;

export type CompilePolishedPdfResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; code: "PAYLOAD_TOO_LARGE" | "INVALID_INPUT"; message: string };

const DENSE_LINE_HEIGHT = 11;
const DENSE_FONT_SIZE = 9;
const DENSE_TOP_Y = 740;
const DENSE_BOTTOM_Y = 64;

function drawCoverPage(ctx: WriterContext, input: PolishedPdfInput): void {
  const stay = input.payload?.segments?.find((segment) => segment.kind === "stay");
  const dateRange =
    stay != null ? `${stay.startDate} – ${stay.endDate}` : "Dates on file with draft";

  ctx.page.drawText("ItineraryEdge", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 100,
    size: 14,
    font: ctx.fontBold,
  });

  ctx.page.drawText(sanitizeForPdf(input.title), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 140,
    size: TITLE_SIZE + 2,
    font: ctx.fontBold,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
  });

  ctx.page.drawText(
    sanitizeForPdf(
      `Destination: ${input.destinationCountry ?? "—"} · Travel dates: ${dateRange}`,
    ),
    {
      x: MARGIN_X,
      y: PAGE_HEIGHT - 168,
      size: FONT_SIZE,
      font: ctx.font,
      maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    },
  );

  ctx.page.drawText(sanitizeForPdf(POLISHED_COVER_HEADLINE), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 220,
    size: 24,
    font: ctx.fontBold,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
  });

  const disclaimerBlock = sanitizeForPdf(
    `${PDF_PACKET_DISCLAIMER} ${ITINERARY_DISCLAIMER}`,
  );
  ctx.page.drawText(disclaimerBlock, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 280,
    size: FONT_SIZE,
    font: ctx.font,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    lineHeight: DENSE_LINE_HEIGHT + 2,
  });

  const qrY = 120;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: qrY,
    width: 96,
    height: 96,
    borderColor: rgb(0.35, 0.35, 0.35),
    borderWidth: 1,
  });
  ctx.page.drawText(sanitizeForPdf(POLISHED_QR_PLACEHOLDER), {
    x: MARGIN_X + 102,
    y: qrY + 40,
    size: FONT_SIZE,
    font: ctx.fontBold,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2 - 102,
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
  };

  paintPolishedPageChrome(ctx);
  drawCoverPage(ctx, input);
  newContentPage(ctx, paintPolishedPageChrome);

  writeLines(ctx, ["Trip summary"], FONT_SIZE + 1, true, paintPolishedPageChrome);
  writeLines(
    ctx,
    [
      `Traveler: ${input.payload?.traveler.displayName ?? input.profileDisplayName ?? "—"}`,
      `Passport: ${input.payload?.traveler.passportCountry ?? "—"}`,
      `Profile: ${input.profileEmail ?? "—"}`,
    ],
    DENSE_FONT_SIZE,
    false,
    paintPolishedPageChrome,
  );
  writeBlank(ctx);

  writeHeading(ctx, "Flights (condensed)", paintPolishedPageChrome);
  for (const segment of input.flightSchedule.segments) {
    writeLines(
      ctx,
      [
        `${segment.direction.toUpperCase()} ${segment.carrier} ${segment.flightNumber}: ${segment.origin}->${segment.destination}`,
        `${segment.departDate} ${segment.departTime} depart · ${segment.arriveDate} ${segment.arriveTime} arrive`,
      ],
      DENSE_FONT_SIZE,
      false,
      paintPolishedPageChrome,
    );
  }

  writeHeading(ctx, "Hotels (condensed)", paintPolishedPageChrome);
  for (const hotel of input.hotelInventory.hotels) {
    writeLines(
      ctx,
      [
        `${hotel.name} · ${hotel.city} · ${hotel.starRating}* · USD ${hotel.nightlyRateUsd}/night`,
        `Stay ${hotel.checkIn} to ${hotel.checkOut}`,
      ],
      DENSE_FONT_SIZE,
      false,
      paintPolishedPageChrome,
    );
  }

  writeHeading(ctx, "Daily plan", paintPolishedPageChrome);
  for (const day of input.sightseeingTimeline.days) {
    writeLines(ctx, [`${day.date} — ${day.theme}`], DENSE_FONT_SIZE, true, paintPolishedPageChrome);
    for (const item of day.items) {
      writeLines(
        ctx,
        [`${item.startTime}-${item.endTime} ${item.title} (${item.place})`],
        DENSE_FONT_SIZE,
        false,
        paintPolishedPageChrome,
      );
    }
    writeBlank(ctx);
  }

  writeHeading(ctx, "Legal", paintPolishedPageChrome);
  writeLines(
    ctx,
    [ITINERARY_DISCLAIMER, PDF_PACKET_DISCLAIMER, POLISHED_DEMO_FOOTER],
    DENSE_FONT_SIZE,
    false,
    paintPolishedPageChrome,
  );

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
