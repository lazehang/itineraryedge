import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleUnlockMockRoute } from "./unlock-mock.js";

describe("handleUnlockMockRoute HTTP errors", () => {
  it("rejects mock unlock when ALLOW_MOCK_UNLOCK is not set", async () => {
    const request = new Request("http://localhost/api/itineraries/id/unlock-mock", {
      method: "POST",
    });

    const response = await handleUnlockMockRoute(
      request,
      { DB: {} as D1Database },
      "id",
      "profile",
    );

    assert.equal(response.status, 403);
    const body = (await response.json()) as { code?: string };
    assert.equal(body.code, "MOCK_UNLOCK_DISABLED");
  });

  it("returns JSON for method not allowed", async () => {
    const request = new Request("http://localhost/api/itineraries/id/unlock-mock", {
      method: "GET",
    });

    const response = await handleUnlockMockRoute(
      request,
      { DB: {} as D1Database, ALLOW_MOCK_UNLOCK: "1" },
      "id",
      "profile",
    );

    assert.equal(response.status, 405);
    assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
  });
});
