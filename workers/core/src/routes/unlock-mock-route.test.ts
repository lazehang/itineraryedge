import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleUnlockMockRoute } from "./unlock-mock.js";

describe("handleUnlockMockRoute HTTP errors", () => {
  it("returns JSON for method not allowed", async () => {
    const request = new Request("http://localhost/api/itineraries/id/unlock-mock", {
      method: "GET",
    });

    const response = await handleUnlockMockRoute(
      request,
      { DB: {} as D1Database },
      "id",
      "profile",
    );

    assert.equal(response.status, 405);
    assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
  });
});
