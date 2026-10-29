# Core worker HTTP API

Base URL: your deployed core worker (local default `http://127.0.0.1:8787`). JSON responses unless noted. CORS preflight is supported.

Service discovery: `GET /` lists routes. `GET /health` returns `{ ok, service, version, d1Bound, timestamp }`.

## Authentication model (MVP)

Most itinerary routes require query parameter **`email`** (normalized lowercase). The worker resolves a D1 profile by email:

- **POST `/api/itineraries`** — creates profile if needed (body includes `email`).
- **Other routes** — profile must already exist; otherwise **404** “No profile found for this email.”

There are no API keys or bearer tokens on the core worker in this iteration. Treat `email` as a capability URL secret in production deployments.

## Itineraries

### `GET /api/itineraries?email=…`

List itineraries for the profile.

**200:** `{ email, itineraries: [ … summaries ] }`

### `POST /api/itineraries`

Create a draft itinerary.

**Body (JSON):** `email`, `travelerName`, `passportNationality`, `destinationCountry` (ISO alpha-2), `startDate`, `endDate` (YYYY-MM-DD), optional `title`.

**201:** `{ itinerary }`  
**422:** `{ errors }` field map

### `GET /api/itineraries/:id?email=…`

**200:** `{ itinerary }` (includes payload and generation fields when present)  
**404:** not found or wrong profile

## Generation

### `POST /api/itineraries/:id/generate?email=…`

Runs AI or mock generation and persists flight/hotel/sightseeing JSON.

**Headers (optional):** `X-BYOK-Key` — client BYOK for OpenAI/Anthropic.

**200:** `{ itinerary, generation: { driver, searchParams } }`  
**401:** `{ code: "BYOK", … }`  
**422:** `{ code: "VALIDATION" \| "SAME_DAY", error, details? }`  
**404:** itinerary not found

## PDF (binary)

### `GET /api/itineraries/:id/pdf?email=…`

Query `variant=polished` for polished layout, or use the dedicated polished path below.

**200:** `application/pdf` body  
**403:** `{ code: "LOCKED", … }` (polished while locked)  
**409:** `{ code: "NOT_GENERATED", … }`  
**404:** not found

### `GET /api/itineraries/:id/pdf/polished?email=…`

Same as polished variant on the standard PDF route.

## Mock unlock (staging)

### `POST /api/itineraries/:id/unlock-mock?email=…`

**200:** `{ itinerary, unlock: { mock: true, alreadyUnlocked } }`  
**403:** `{ code: "MOCK_UNLOCK_DISABLED" }` when `ALLOW_MOCK_UNLOCK` is not `1`  
**404:** not found

## Error conventions

- **400** — missing `email` query param  
- **405** — wrong HTTP method  
- **404** — unknown route returns `{ error: "Not found" }`

PDF error responses use JSON bodies with the same status codes when not returning PDF bytes.
