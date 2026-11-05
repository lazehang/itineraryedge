import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPlanFieldsHeuristic,
  isDestinationCountryGrounded,
  isPassportNationalityGrounded,
  parseExtractJson,
} from "./plan-extract.js";

describe("extractPlanFieldsHeuristic", () => {
  it("pulls destination, dates, and name from a clear prompt", () => {
    const result = extractPlanFieldsHeuristic(
      "I am Alex Traveler visiting Japan from 2026-06-01 to 2026-06-08 with a US passport",
    );
    assert.equal(result.destinationCountry, "JP");
    assert.equal(result.startDate, "2026-06-01");
    assert.equal(result.endDate, "2026-06-08");
    assert.equal(result.travelerName, "Alex Traveler");
    assert.equal(result.passportNationality, "US");
  });

  it("does not invent passport nationality", () => {
    const result = extractPlanFieldsHeuristic(
      "Trip to France from 2026-07-01 to 2026-07-10 for museums",
    );
    assert.equal(result.destinationCountry, "FR");
    assert.equal(result.passportNationality, undefined);
  });

  it("does not treat 'my passport' as Malaysia (MY)", () => {
    const result = extractPlanFieldsHeuristic(
      "I need documents for my passport renewal trip to Japan from 2026-06-01 to 2026-06-08",
    );
    assert.equal(result.destinationCountry, "JP");
    assert.equal(result.passportNationality, undefined);
  });

  it("does not map Ukraine to GB via 'uk' substring", () => {
    const result = extractPlanFieldsHeuristic(
      "Weekend in Ukraine from 2026-06-01 to 2026-06-08 for culture",
    );
    assert.equal(result.destinationCountry, "UA");
    assert.notEqual(result.destinationCountry, "GB");
  });

  it("does not treat English 'in' as India", () => {
    const result = extractPlanFieldsHeuristic(
      "Trip in museums from 2026-06-01 to 2026-06-08 please",
    );
    assert.equal(result.destinationCountry, undefined);
  });
});

describe("BYOK extract grounding", () => {
  it("drops invented passport nationality from model JSON", () => {
    const prompt = "Trip to Japan from 2026-06-01 to 2026-06-08 for culture";
    const parsed = parseExtractJson(
      JSON.stringify({
        travelerName: "Alex",
        passportNationality: "US",
        destinationCountry: "JP",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      }),
      prompt,
    );
    assert.ok(parsed);
    assert.equal(parsed?.passportNationality, undefined);
    assert.equal(parsed?.destinationCountry, "JP");
  });

  it("keeps passport nationality when grounded in the prompt", () => {
    const prompt =
      "I am Alex visiting Japan from 2026-06-01 to 2026-06-08 with a US passport";
    assert.equal(isPassportNationalityGrounded(prompt, "US"), true);
    const parsed = parseExtractJson(
      JSON.stringify({
        passportNationality: "US",
        destinationCountry: "JP",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      }),
      prompt,
    );
    assert.equal(parsed?.passportNationality, "US");
  });

  it("rejects destination codes not grounded in the prompt", () => {
    assert.equal(
      isDestinationCountryGrounded("museums from 2026-06-01 to 2026-06-08", "FR"),
      false,
    );
  });
});
