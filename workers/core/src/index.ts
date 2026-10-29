export interface Env {
  DB: D1Database;
}

const SERVICE = "itineraryedge-core";
const VERSION = "0.1.0";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/health" || pathname === "/health/") {
      return Response.json({
        ok: true,
        service: SERVICE,
        version: VERSION,
        d1Bound: Boolean(env.DB),
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === "/" || pathname === "") {
      return Response.json({
        service: SERVICE,
        version: VERSION,
        routes: ["/health"],
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
