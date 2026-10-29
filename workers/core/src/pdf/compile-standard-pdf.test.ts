import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER } from "./disclaimer.js";
import { compileStandardPdf } from "./compile-standard-pdf.js";
import { mockStandardPdfInput } from "./fixtures/mock-generation.fixture.js";

describe("compileStandardPdf", () => {
  it("produces a valid PDF with the packet disclaimer", async () => {
    const result = await compileStandardPdf(mockStandardPdfInput);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.ok(result.bytes.byteLength > 100);
    assert.equal(String.fromCharCode(...result.bytes.slice(0, 4)), "%PDF");

    const loaded = await PDFDocument.load(result.bytes);
    assert.ok(loaded.getPageCount() >= 1);
    assert.ok(loaded.getSubject()?.includes("not an official consular document"));
    const keywordsRaw = loaded.getKeywords() ?? "";
    const keywordsText = Array.isArray(keywordsRaw) ? keywordsRaw.join(" ") : keywordsRaw;
    assert.ok(keywordsText.includes(PDF_PACKET_DISCLAIMER));
  });
});
