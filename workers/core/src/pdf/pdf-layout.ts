import { StandardFonts, type PDFFont, type PDFPage, type PDFDocument } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER, PDF_PACKET_HEADER } from "./disclaimer.js";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;
export const MARGIN_X = 50;
export const TOP_CONTENT_Y = 720;
export const BOTTOM_CONTENT_Y = 72;
export const LINE_HEIGHT = 13;
export const FONT_SIZE = 10;
export const HEADER_SIZE = 9;
export const TITLE_SIZE = 16;

export const POLISHED_DEMO_FOOTER = "Polished (demo unlock)" as const;
export const POLISHED_QR_PLACEHOLDER = "Verification QR (placeholder)" as const;
export const POLISHED_COVER_HEADLINE = "SUPPORTING TRAVEL PACKET" as const;

export function sanitizeForPdf(text: string): string {
  return text
    .replaceAll("→", "->")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("★", "*");
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

export function drawStandardFooter(ctx: WriterContext): void {
  const footerY = 36;
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: footerY,
    size: HEADER_SIZE,
    font: ctx.font,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    lineHeight: lineHeight(ctx),
  });
}

export function drawPolishedFooter(ctx: WriterContext): void {
  const footerY = 36;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
  ctx.page.drawText(sanitizeForPdf(PDF_PACKET_DISCLAIMER), {
    x: MARGIN_X,
    y: footerY + 14,
    size: HEADER_SIZE,
    font: ctx.font,
    maxWidth,
    lineHeight: lineHeight(ctx),
  });
  ctx.page.drawText(sanitizeForPdf(POLISHED_DEMO_FOOTER), {
    x: MARGIN_X,
    y: footerY,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    maxWidth,
  });
}

export function paintStandardPageChrome(ctx: WriterContext): void {
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
    lineHeight: lineHeight(ctx),
  });
  drawStandardFooter(ctx);
}

export function paintPolishedPageChrome(ctx: WriterContext): void {
  ctx.page.drawText(sanitizeForPdf("ItineraryEdge — polished travel packet"), {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 40,
    size: HEADER_SIZE,
    font: ctx.fontBold,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
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
): void {
  const font = bold ? ctx.fontBold : ctx.font;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;

  for (const raw of lines) {
    const wrapped = wrapLine(sanitizeForPdf(raw), font, size, maxWidth);
    for (const line of wrapped) {
      ensureSpace(ctx, 1, chrome);
      ctx.page.drawText(line, { x: MARGIN_X, y: ctx.y, size, font });
      ctx.y -= lineHeight(ctx);
    }
  }
}

export function writeHeading(
  ctx: WriterContext,
  text: string,
  chrome: (ctx: WriterContext) => void = paintStandardPageChrome,
): void {
  ensureSpace(ctx, 2, chrome);
  ctx.y -= 4;
  writeLines(ctx, [text], FONT_SIZE + 2, true, chrome);
  ctx.y -= 2;
}

export function writeBlank(ctx: WriterContext): void {
  ctx.y -= lineHeight(ctx);
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
