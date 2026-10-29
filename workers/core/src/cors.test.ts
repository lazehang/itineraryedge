import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  corsHeaders,
  isOriginAllowed,
  jsonResponse,
  parseAllowedOrigins,
  preflightResponse,
} from "./cors.js";

describe("parseAllowedOrigins", () => {
  it("merges APP_ORIGIN and ALLOWED_ORIGINS", () => {
    const allowed = parseAllowedOrigins({
      APP_ORIGIN: "https://app.example.com",
      ALLOWED_ORIGINS: "https://preview.example.com, https://staging.example.com",
    });
    assert.deepEqual([...allowed].sort(), [
      "https://app.example.com",
      "https://preview.example.com",
      "https://staging.example.com",
    ]);
  });
});

describe("corsHeaders allowlist", () => {
  const env = {
    APP_ORIGIN: "https://app.example.com",
    ALLOWED_ORIGINS: "https://preview.example.com",
  };

  it("reflects Origin when allowlisted", () => {
    const request = new Request("http://localhost/health", {
      headers: { Origin: "https://app.example.com" },
    });
    const headers = corsHeaders(request, env) as Record<string, string>;
    assert.equal(headers["Access-Control-Allow-Origin"], "https://app.example.com");
  });

  it("reflects secondary allowlisted Origin", () => {
    const request = new Request("http://localhost/health", {
      headers: { Origin: "https://preview.example.com" },
    });
    const headers = corsHeaders(request, env) as Record<string, string>;
    assert.equal(headers["Access-Control-Allow-Origin"], "https://preview.example.com");
  });

  it("omits Access-Control-Allow-Origin for unknown Origin", () => {
    const request = new Request("http://localhost/health", {
      headers: { Origin: "https://evil.example.com" },
    });
    const headers = corsHeaders(request, env) as Record<string, string>;
    assert.equal(headers["Access-Control-Allow-Origin"], undefined);
  });

  it("uses wildcard only when no allowlist is configured and Origin is absent", () => {
    const request = new Request("http://localhost/health");
    const headers = corsHeaders(request, {}) as Record<string, string>;
    assert.equal(headers["Access-Control-Allow-Origin"], "*");
  });

  it("does not emit wildcard when allowlist is configured and Origin is absent", () => {
    const request = new Request("http://localhost/health");
    const headers = corsHeaders(request, env) as Record<string, string>;
    assert.equal(headers["Access-Control-Allow-Origin"], undefined);
  });
});

describe("isOriginAllowed", () => {
  it("allows any origin when allowlist is empty (local dev)", () => {
    assert.equal(isOriginAllowed("https://any.example.com", {}), true);
  });

  it("denies unknown origin when allowlist is set", () => {
    assert.equal(
      isOriginAllowed("https://evil.example.com", { APP_ORIGIN: "https://app.example.com" }),
      false,
    );
  });
});

describe("preflightResponse", () => {
  const env = { APP_ORIGIN: "https://app.example.com" };

  it("returns 204 for allowlisted Origin", () => {
    const request = new Request("http://localhost/api/itineraries", {
      method: "OPTIONS",
      headers: { Origin: "https://app.example.com" },
    });
    const response = preflightResponse(request, env);
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://app.example.com");
  });

  it("returns 403 for disallowed Origin", () => {
    const request = new Request("http://localhost/api/itineraries", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example.com" },
    });
    const response = preflightResponse(request, env);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  });
});

describe("jsonResponse CORS integration", () => {
  it("does not attach ACAO for disallowed cross-origin requests", () => {
    const request = new Request("http://localhost/health", {
      headers: { Origin: "https://evil.example.com" },
    });
    const response = jsonResponse(
      request,
      { APP_ORIGIN: "https://app.example.com" },
      { ok: true },
    );
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  });
});
