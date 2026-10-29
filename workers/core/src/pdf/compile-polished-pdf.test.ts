import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import { PDF_PACKET_DISCLAIMER } from "./disclaimer.js";
import { compilePolishedPdf } from "./compile-polished-pdf.js";
import { compileStandardPdf } from "./compile-standard-pdf.js";
import { POLISHED_DEMO_FOOTER, POLISHED_QR_PLACEHOLDER } from "./pdf-layout.js";
import { mockStandardPdfInput } from "./fixtures/mock-generation.fixture.js";
import { polishedPdfAccess } from "./pdf-access.js";

describe("compilePolishedPdf", () => {
  it("produces a valid PDF with disclaimer and polished markers", async () => {
    const result = await compilePolishedPdf(mockStandardPdfInput);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.ok(result.bytes.byteLength > 100);
    assert.equal(String.fromCharCode(...result.bytes.slice(0, 4)), "%PDF");

    const loaded = await PDFDocument.load(result.bytes);
    assert.ok(loaded.getPageCount() >= 1);
    assert.ok(loaded.getSubject()?.includes(PDF_PACKET_DISCLAIMER));
    assert.ok(loaded.getSubject()?.includes(POLISHED_DEMO_FOOTER));
    const keywordsRaw = loaded.getKeywords() ?? "";
    const keywordsText = Array.isArray(keywordsRaw) ? keywordsRaw.join(" ") : keywordsRaw;
    assert.ok(keywordsText.includes(POLISHED_QR_PLACEHOLDER));
    assert.ok(keywordsText.includes("SUPPORTING TRAVEL PACKET"));
  });
});

describe("polishedPdfAccess", () => {
  it("denies polished PDF when locked", () => {
    const access = polishedPdfAccess("polished", false);
    assert.equal(access.allowed, false);
    if (access.allowed) {
      return;
    }
    assert.equal(access.code, "LOCKED");
  });

  it("allows standard PDF when locked", () => {
    assert.deepEqual(polishedPdfAccess("standard", false), { allowed: true });
  });
});

describe("compileStandardPdf when locked itinerary", () => {
  it("still compiles standard output", async () => {
    const result = await compileStandardPdf(mockStandardPdfInput);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(String.fromCharCode(...result.bytes.slice(0, 4)), "%PDF");
  });
});
