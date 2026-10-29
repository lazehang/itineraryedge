import { jsonResponse, preflightResponse } from "./cors.js";
import { handleItinerariesRoute } from "./routes/itineraries.js";

export interface Env {
  DB: D1Database;
  /** openai (default) | anthropic — used when a BYOK key is present */
  AI_PROVIDER?: string;
  /** Optional server-side BYOK fallback (never commit real keys) */
  BYOK_AI_KEY?: string;
  /** Set to "1" to enable POST …/unlock-mock (local/staging only; off in production) */
  ALLOW_MOCK_UNLOCK?: string;
  /** Primary web app origin for CORS (required in staging/production) */
  APP_ORIGIN?: string;
  /** Additional comma-separated origins allowed for CORS */
  ALLOWED_ORIGINS?: string;
}

const SERVICE = "itineraryedge-core";
const VERSION = "0.6.0";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return preflightResponse(request, env);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/health" || pathname === "/health/") {
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          service: SERVICE,
          version: VERSION,
          d1Bound: Boolean(env.DB),
          timestamp: new Date().toISOString(),
        },
      );
    }

    const itineraryResponse = await handleItinerariesRoute(request, env, pathname);
    if (itineraryResponse) {
      return itineraryResponse;
    }

    if (pathname === "/" || pathname === "") {
      return jsonResponse(request, env, {
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

    return jsonResponse(request, env, { error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
