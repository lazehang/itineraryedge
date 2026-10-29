import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { sanitizeForPdf } from "./pdf-layout.js";

describe("sanitizeForPdf", () => {
  it("replaces CJK characters with placeholders safe for WinAnsi fonts", () => {
    const sanitized = sanitizeForPdf("Tokyo 東京 tower");
    assert.equal(sanitized, "Tokyo ?? tower");
  });

  it("allows drawText with Helvetica after sanitizing mixed scripts", async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage();
    assert.doesNotThrow(() => {
      page.drawText(sanitizeForPdf("Visit 浅草 — highlights"), {
        x: 50,
        y: 700,
        size: 10,
        font,
      });
    });
  });
});
