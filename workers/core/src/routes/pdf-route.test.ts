import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handlePdfRoute } from "./pdf.js";

describe("handlePdfRoute HTTP errors", () => {
  it("returns JSON for method not allowed", async () => {
    const request = new Request("http://localhost/api/itineraries/id/pdf", {
      method: "POST",
    });

    const response = await handlePdfRoute(
      request,
      { DB: {} as D1Database },
      "id",
      "profile",
      "traveler@example.com",
      null,
      "/api/itineraries/id/pdf",
    );

    assert.equal(response.status, 405);
    assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
    const body = (await response.json()) as { error?: string };
    assert.ok(body.error);
  });

  it("returns JSON when itinerary is missing", async () => {
    const db = {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return null;
              },
            };
          },
        };
      },
    } as unknown as D1Database;

    const request = new Request(
      "http://localhost/api/itineraries/missing/pdf?email=traveler@example.com",
    );

    const response = await handlePdfRoute(
      request,
      { DB: db },
      "missing",
      "profile",
      "traveler@example.com",
      "Alex",
      "/api/itineraries/missing/pdf",
    );

    assert.equal(response.status, 404);
    assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
  });
});
