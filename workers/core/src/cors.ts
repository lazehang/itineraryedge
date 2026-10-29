const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-BYOK-Key";

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

export function jsonResponse(
  request: Request,
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), { ...init, headers });
}

export function preflightResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

type PdfResponseOptions = {
  status: number;
  filename?: string;
  jsonError?: unknown;
};

export function pdfResponse(
  request: Request,
  bytes: Uint8Array,
  options: PdfResponseOptions,
): Response {
  const headers = new Headers();
  const cors = corsHeaders(request);
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
