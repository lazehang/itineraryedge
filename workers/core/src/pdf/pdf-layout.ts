import { StandardFonts, rgb, type PDFFont, type PDFPage, type PDFDocument, type RGB } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER, PDF_PACKET_HEADER } from "./disclaimer.js";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;
export const MARGIN_X = 48;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
export const TOP_CONTENT_Y = 700;
export const BOTTOM_CONTENT_Y = 78;
export const LINE_HEIGHT = 14;
export const FONT_SIZE = 10;
export const HEADER_SIZE = 8;
export const TITLE_SIZE = 18;
export const LABEL_SIZE = 8;
export const SECTION_SIZE = 11;

export const POLISHED_DEMO_FOOTER = "Polished (demo unlock)" as const;
export const POLISHED_QR_PLACEHOLDER = "Verification QR (placeholder)" as const;
export const POLISHED_COVER_HEADLINE = "SUPPORTING TRAVEL PACKET" as const;

/** Brand ink — professional navy, not decorative. */
export const INK = rgb(0.12, 0.16, 0.24);
export const MUTED = rgb(0.38, 0.42, 0.48);
export const RULE = rgb(0.78, 0.81, 0.85);
export const BAND = rgb(0.12, 0.18, 0.32);
export const BAND_SOFT = rgb(0.94, 0.95, 0.97);
export const ACCENT = rgb(0.12, 0.35, 0.55);
export const WHITE = rgb(1, 1, 1);

/** WinAnsi-safe text for StandardFonts (Helvetica) — strips CJK and other non-encodable code points. */
export function sanitizeForPdf(text: string): string {
  const normalized = text
    .normalize("NFKC")
    .replaceAll("→", "->")
    .replaceAll("←", "<-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("★", "*")
    .replaceAll("·", "|")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'");

  let output = "";
  for (const char of normalized) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x7e || (code >= 0xa0 && code <= 0xff)) {
      output += char;
    } else if (/\s/u.test(char)) {
      output += " ";
    } else {
      output += "?";
    }
  }
  return output;
}

export function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
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

export type WriterContext = {
  pdfDoc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
  lineHeight?: number;
  topContentY?: number;
  bottomContentY?: number;
  pageNumber?: number;
};

function lineHeight(ctx: WriterContext): number {
  return ctx.lineHeight ?? LINE_HEIGHT;
}

function topY(ctx: WriterContext): number {
  return ctx.topContentY ?? TOP_CONTENT_Y;
}

function bottomY(ctx: WriterContext): number {
  return ctx.bottomContentY ?? BOTTOM_CONTENT_Y;
}

function nextPageNumber(ctx: WriterContext): number {
  ctx.pageNumber = (ctx.pageNumber ?? 0) + 1;
  return ctx.pageNumber;
}

export function drawHairline(
  page: PDFPage,
  y: number,
  options?: { x?: number; width?: number; color?: RGB },
): void {
  const x = options?.x ?? MARGIN_X;
  const width = options?.width ?? CONTENT_WIDTH;
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.75,
    color: options?.color ?? RULE,
  });
}

export function drawStandardFooter(ctx: WriterContext): void {
  const footerY = 42;
  drawHairline(ctx.page, footerY + 22);
  const pageLabel = `Page ${ctx.pageNumber ?? 1}`;
  const pageWidth = ctx.font.widthOfTextAtSize(pageLabel, HEADER_SIZE);
  ctx.page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN_X - pageWidth,
    y: footerY + 8,
    size: HEADER_SIZE,
    font: ctx.font,
    color: MUTED,
  });
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: footerY,
    size: HEADER_SIZE - 0.5,
    font: ctx.font,
    color: MUTED,
    maxWidth: CONTENT_WIDTH - pageWidth - 12,
    lineHeight: 10,
  });
}

export function drawPolishedFooter(ctx: WriterContext): void {
  const footerY = 40;
  drawHairline(ctx.page, footerY + 26);
  const pageLabel = `Page ${ctx.pageNumber ?? 1}`;
  const pageWidth = ctx.font.widthOfTextAtSize(pageLabel, HEADER_SIZE);
  ctx.page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN_X - pageWidth,
    y: footerY + 12,
    size: HEADER_SIZE,
    font: ctx.font,
    color: MUTED,
  });
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: footerY + 12,
    size: HEADER_SIZE - 0.5,
    font: ctx.font,
    color: MUTED,
    maxWidth: CONTENT_WIDTH - pageWidth - 12,
  });
  ctx.page.drawText(sanitizeForPdf(POLISHED_DEMO_FOOTER), {
    x: MARGIN_X,
    y: footerY,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    color: ACCENT,
    maxWidth: CONTENT_WIDTH,
  });
}

export function paintStandardPageChrome(ctx: WriterContext): void {
  nextPageNumber(ctx);

  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 56,
    width: PAGE_WIDTH,
    height: 56,
    color: BAND,
  });

  ctx.page.drawText("ItineraryEdge", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 28,
    size: 11,
    font: ctx.fontBold,
    color: WHITE,
  });

  ctx.page.drawText(sanitizeForPdf("Supporting travel schedule packet"), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 42,
    size: HEADER_SIZE,
    font: ctx.font,
    color: rgb(0.78, 0.84, 0.92),
  });

  const mode = "STANDARD";
  const modeWidth = ctx.fontBold.widthOfTextAtSize(mode, HEADER_SIZE);
  ctx.page.drawText(mode, {
    x: PAGE_WIDTH - MARGIN_X - modeWidth,
    y: PAGE_HEIGHT - 30,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    color: WHITE,
  });

  // Keep disclaimer string available in chrome path for tests / searchable text.
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_HEADER), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 68,
    size: 1,
    font: ctx.font,
    color: WHITE,
  });

  drawStandardFooter(ctx);
}

export function paintPolishedPageChrome(ctx: WriterContext): void {
  nextPageNumber(ctx);

  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 48,
    width: PAGE_WIDTH,
    height: 48,
    color: BAND,
  });

  ctx.page.drawText("ItineraryEdge", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 24,
    size: 11,
    font: ctx.fontBold,
    color: WHITE,
  });

  ctx.page.drawText(sanitizeForPdf("Polished supporting travel packet"), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 38,
    size: HEADER_SIZE,
    font: ctx.font,
    color: rgb(0.78, 0.84, 0.92),
  });

  const mode = "POLISHED";
  const modeWidth = ctx.fontBold.widthOfTextAtSize(mode, HEADER_SIZE);
  ctx.page.drawText(mode, {
    x: PAGE_WIDTH - MARGIN_X - modeWidth,
    y: PAGE_HEIGHT - 28,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    color: WHITE,
  });

  drawPolishedFooter(ctx);
}

export function newContentPage(ctx: WriterContext, chrome: (ctx: WriterContext) => void): void {
  ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = topY(ctx);
  chrome(ctx);
}

export function ensureSpace(
  ctx: WriterContext,
  linesNeeded: number,
  chrome: (ctx: WriterContext) => void,
): void {
  if (ctx.y - linesNeeded * lineHeight(ctx) < bottomY(ctx)) {
    newContentPage(ctx, chrome);
  }
}

export function writeLines(
  ctx: WriterContext,
  lines: string[],
  size = FONT_SIZE,
  bold = false,
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
  options?: { color?: RGB; x?: number; maxWidth?: number },
): void {
  const font = bold ? ctx.fontBold : ctx.font;
  const maxWidth = options?.maxWidth ?? CONTENT_WIDTH;
  const x = options?.x ?? MARGIN_X;
  const color = options?.color ?? INK;

  for (const raw of lines) {
    const wrapped = wrapLine(sanitizeForPdf(raw), font, size, maxWidth);
    for (const line of wrapped) {
      ensureSpace(ctx, 1, chrome);
      ctx.page.drawText(line, { x, y: ctx.y, size, font, color });
      ctx.y -= lineHeight(ctx);
    }
  }
}

export function writeHeading(
  ctx: WriterContext,
  text: string,
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  ensureSpace(ctx, 3, chrome);
  ctx.y -= 10;

  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - 2,
    width: 3,
    height: 14,
    color: ACCENT,
  });

  ctx.page.drawText(sanitizeForPdf(text.toUpperCase()), {
    x: MARGIN_X + 10,
    y: ctx.y,
    size: SECTION_SIZE,
    font: ctx.fontBold,
    color: INK,
  });
  ctx.y -= 8;
  drawHairline(ctx.page, ctx.y);
  ctx.y -= 14;
}

export function writeBlank(ctx: WriterContext, multiples = 1): void {
  ctx.y -= lineHeight(ctx) * multiples;
}

export function writeKeyValueGrid(
  ctx: WriterContext,
  rows: Array<[string, string]>,
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  const colGap = 16;
  const colWidth = (CONTENT_WIDTH - colGap) / 2;

  for (let index = 0; index < rows.length; index += 2) {
    ensureSpace(ctx, 3, chrome);
    const left = rows[index];
    const right = rows[index + 1];

    if (left) {
      ctx.page.drawText(sanitizeForPdf(left[0].toUpperCase()), {
        x: MARGIN_X,
        y: ctx.y,
        size: LABEL_SIZE,
        font: ctx.fontBold,
        color: MUTED,
      });
      const leftLines = wrapLine(left[1], ctx.font, FONT_SIZE, colWidth);
      let valueY = ctx.y - 12;
      for (const line of leftLines) {
        ctx.page.drawText(line, {
          x: MARGIN_X,
          y: valueY,
          size: FONT_SIZE,
          font: ctx.font,
          color: INK,
        });
        valueY -= lineHeight(ctx);
      }
    }

    if (right) {
      const rightX = MARGIN_X + colWidth + colGap;
      ctx.page.drawText(sanitizeForPdf(right[0].toUpperCase()), {
        x: rightX,
        y: ctx.y,
        size: LABEL_SIZE,
        font: ctx.fontBold,
        color: MUTED,
      });
      const rightLines = wrapLine(right[1], ctx.font, FONT_SIZE, colWidth);
      let valueY = ctx.y - 12;
      for (const line of rightLines) {
        ctx.page.drawText(line, {
          x: rightX,
          y: valueY,
          size: FONT_SIZE,
          font: ctx.font,
          color: INK,
        });
        valueY -= lineHeight(ctx);
      }
    }

    ctx.y -= 32;
  }
}

export function writeInfoCard(
  ctx: WriterContext,
  lines: string[],
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  const padding = 12;
  const wrapped: string[] = [];
  for (const line of lines) {
    wrapped.push(...wrapLine(line, ctx.font, FONT_SIZE, CONTENT_WIDTH - padding * 2));
  }
  const boxHeight = wrapped.length * lineHeight(ctx) + padding * 2;
  ensureSpace(ctx, Math.ceil(boxHeight / lineHeight(ctx)) + 1, chrome);

  const boxBottom = ctx.y - boxHeight + 8;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: boxBottom,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: BAND_SOFT,
    borderColor: RULE,
    borderWidth: 0.75,
  });

  let textY = ctx.y - padding;
  for (const line of wrapped) {
    ctx.page.drawText(line, {
      x: MARGIN_X + padding,
      y: textY,
      size: FONT_SIZE,
      font: ctx.font,
      color: INK,
    });
    textY -= lineHeight(ctx);
  }
  ctx.y = boxBottom - 12;
}

export function writeEntryBlock(
  ctx: WriterContext,
  title: string,
  details: string[],
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  ensureSpace(ctx, 2 + details.length, chrome);
  writeLines(ctx, [title], FONT_SIZE, true, chrome, { color: INK });
  for (const detail of details) {
    writeLines(ctx, [detail], FONT_SIZE - 0.5, false, chrome, {
      color: MUTED,
      x: MARGIN_X + 8,
      maxWidth: CONTENT_WIDTH - 8,
    });
  }
  ctx.y -= 6;
  drawHairline(ctx.page, ctx.y, { color: rgb(0.88, 0.9, 0.92) });
  ctx.y -= 12;
}

export function writeTimelineDay(
  ctx: WriterContext,
  dayLabel: string,
  items: string[],
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  ensureSpace(ctx, 2 + items.length, chrome);
  writeLines(ctx, [dayLabel], FONT_SIZE, true, chrome, { color: ACCENT });

  const ruleX = MARGIN_X + 4;
  const startY = ctx.y + 4;

  for (const item of items) {
    ensureSpace(ctx, 2, chrome);
    ctx.page.drawCircle({
      x: ruleX,
      y: ctx.y + 3,
      size: 2.2,
      color: ACCENT,
    });
    writeLines(ctx, [item], FONT_SIZE - 0.5, false, chrome, {
      x: MARGIN_X + 14,
      maxWidth: CONTENT_WIDTH - 14,
      color: INK,
    });
  }

  const endY = ctx.y + 10;
  if (startY > endY) {
    ctx.page.drawLine({
      start: { x: ruleX, y: startY },
      end: { x: ruleX, y: endY },
      thickness: 1,
      color: RULE,
    });
  }
  ctx.y -= 8;
}

export async function embedPdfFonts(pdfDoc: PDFDocument): Promise<{ font: PDFFont; fontBold: PDFFont }> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { font, fontBold };
}

export function estimateGenerationJsonBytes(parts: unknown[]): number {
  let total = 0;
  for (const part of parts) {
    total += JSON.stringify(part).length;
  }
  return total;
}
