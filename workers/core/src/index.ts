import { jsonResponse, preflightResponse } from "./cors.js";
import { handleItinerariesRoute } from "./routes/itineraries.js";

export interface Env {
  DB: D1Database;
}

const SERVICE = "itineraryedge-core";
const VERSION = "0.2.0";

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
        routes: ["/health", "GET/POST /api/itineraries", "GET /api/itineraries/:id"],
      });
    }

    return jsonResponse(request, { error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
