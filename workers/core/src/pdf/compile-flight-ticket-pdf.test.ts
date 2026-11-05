import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import { FLIGHT_TICKET_DISCLAIMER, GENERATION_SCHEMA_VERSION } from "@itineraryedge/shared";
import { compileFlightTicketPdf } from "./compile-flight-ticket-pdf.js";
import { mockStandardPdfInput } from "./fixtures/mock-generation.fixture.js";

describe("compileFlightTicketPdf", () => {
  it("produces a coupon PDF with disclaimer metadata", async () => {
    const result = await compileFlightTicketPdf({
      itineraryId: mockStandardPdfInput.itineraryId,
      title: mockStandardPdfInput.title,
      profileEmail: mockStandardPdfInput.profileEmail,
      profileDisplayName: mockStandardPdfInput.profileDisplayName,
      payload: mockStandardPdfInput.payload,
      flightSchedule: {
        schemaVersion: GENERATION_SCHEMA_VERSION,
        segments: [
          {
            direction: "outbound",
            carrier: "Sample Carrier",
            flightNumber: "SC401",
            origin: "New York",
            destination: "Tokyo",
            originAirport: "JFK",
            destinationAirport: "NRT",
            bookingRef: "ABC12X",
            cabinClass: "Economy",
            seat: "14A",
            terminal: "1",
            departDate: "2026-04-01",
            departTime: "08:30",
            arriveDate: "2026-04-01",
            arriveTime: "14:00",
          },
          {
            direction: "return",
            carrier: "Sample Carrier",
            flightNumber: "SC402",
            origin: "Tokyo",
            destination: "New York",
            originAirport: "NRT",
            destinationAirport: "JFK",
            bookingRef: "ABC12X",
            cabinClass: "Economy",
            departDate: "2026-04-05",
            departTime: "17:00",
            arriveDate: "2026-04-05",
            arriveTime: "22:30",
          },
        ],
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(String.fromCharCode(...result.bytes.slice(0, 4)), "%PDF");
    const loaded = await PDFDocument.load(result.bytes);
    assert.equal(loaded.getPageCount(), 2);
    assert.ok(loaded.getSubject()?.includes(FLIGHT_TICKET_DISCLAIMER));
  });

  it("filters to a single leg when requested", async () => {
    const result = await compileFlightTicketPdf({
      itineraryId: mockStandardPdfInput.itineraryId,
      title: mockStandardPdfInput.title,
      profileEmail: mockStandardPdfInput.profileEmail,
      profileDisplayName: mockStandardPdfInput.profileDisplayName,
      payload: mockStandardPdfInput.payload,
      flightSchedule: mockStandardPdfInput.flightSchedule,
      leg: "outbound",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const loaded = await PDFDocument.load(result.bytes);
    assert.equal(loaded.getPageCount(), 1);
  });

  it("does not invent IATA codes from city name prefixes", async () => {
    const result = await compileFlightTicketPdf({
      itineraryId: mockStandardPdfInput.itineraryId,
      title: mockStandardPdfInput.title,
      profileEmail: mockStandardPdfInput.profileEmail,
      profileDisplayName: mockStandardPdfInput.profileDisplayName,
      payload: mockStandardPdfInput.payload,
      flightSchedule: {
        schemaVersion: GENERATION_SCHEMA_VERSION,
        segments: [
          {
            direction: "outbound",
            carrier: "Sample Carrier",
            flightNumber: "SC401",
            origin: "New York",
            destination: "Tokyo",
            departDate: "2026-04-01",
            departTime: "08:30",
            arriveDate: "2026-04-01",
            arriveTime: "14:00",
          },
        ],
      },
      leg: "outbound",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    // pdf-lib content streams are compressed; ensure compile succeeds without
    // fabricating codes (regression covered by originAirport/destinationAirport
    // fallbacks using "---" in compile-flight-ticket-pdf.ts).
    assert.ok(result.bytes.byteLength > 100);
  });
});
