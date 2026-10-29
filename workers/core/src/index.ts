import { jsonResponse, preflightResponse } from "./cors.js";
import { handleItinerariesRoute } from "./routes/itineraries.js";

export interface Env {
  DB: D1Database;
  /** openai (default) | anthropic — used when a BYOK key is present */
  AI_PROVIDER?: string;
  /** Optional server-side BYOK fallback (never commit real keys) */
  BYOK_AI_KEY?: string;
}

const SERVICE = "itineraryedge-core";
const VERSION = "0.5.0";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return preflightResponse(request);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/health" || pathname === "/health/") {
      return jsonResponse(request, {
        ok: true,
        service: SERVICE,
        version: VERSION,
        d1Bound: Boolean(env.DB),
        timestamp: new Date().toISOString(),
      });
    }

    const itineraryResponse = await handleItinerariesRoute(request, env, pathname);
    if (itineraryResponse) {
      return itineraryResponse;
    }

    if (pathname === "/" || pathname === "") {
      return jsonResponse(request, {
        service: SERVICE,
        version: VERSION,
        routes: [
          "/health",
          "GET/POST /api/itineraries",
          "GET /api/itineraries/:id",
          "POST /api/itineraries/:id/generate",
          "GET /api/itineraries/:id/pdf",
          "GET /api/itineraries/:id/pdf/polished",
          "POST /api/itineraries/:id/unlock-mock",
        ],
      });
    }

    return jsonResponse(request, { error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
