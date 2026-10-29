const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-BYOK-Key";

/** Worker bindings used to build the CORS allowlist (see README). */
export type CorsEnv = {
  APP_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
};

export function parseAllowedOrigins(env: CorsEnv): Set<string> {
  const allowed = new Set<string>();
  const appOrigin = env.APP_ORIGIN?.trim();
  if (appOrigin) {
    allowed.add(appOrigin);
  }
  const extra = env.ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const origin = part.trim();
      if (origin) {
        allowed.add(origin);
      }
    }
  }
  return allowed;
}

export function isOriginAllowed(origin: string, env: CorsEnv): boolean {
  const allowed = parseAllowedOrigins(env);
  if (allowed.size === 0) {
    return true;
  }
  return allowed.has(origin);
}

export function corsHeaders(request: Request, env: CorsEnv): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowed = parseAllowedOrigins(env);
  const strict = allowed.size > 0;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
    Vary: "Origin",
  };

  if (origin) {
    if (!strict || allowed.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  } else if (!strict) {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

export function jsonResponse(
  request: Request,
  env: CorsEnv,
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  const cors = corsHeaders(request, env);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), { ...init, headers });
}

export function preflightResponse(request: Request, env: CorsEnv): Response {
  const origin = request.headers.get("Origin");
  if (origin && !isOriginAllowed(origin, env)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

type PdfResponseOptions = {
  status: number;
  filename?: string;
  jsonError?: unknown;
};

export function pdfResponse(
  request: Request,
  env: CorsEnv,
  bytes: Uint8Array,
  options: PdfResponseOptions,
): Response {
  const headers = new Headers();
  const cors = corsHeaders(request, env);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }

  if (options.jsonError !== undefined) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(options.jsonError), {
      status: options.status,
      headers,
    });
  }

  headers.set("Content-Type", "application/pdf");
  if (options.filename) {
    headers.set("Content-Disposition", `attachment; filename="${options.filename}"`);
  }

  return new Response(bytes as unknown as BodyInit, { status: options.status, headers });
}
