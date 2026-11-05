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

Create a draft itinerary (manual / structured path).

**Body (JSON):** `email`, `travelerName`, `passportNationality`, `destinationCountry` (ISO alpha-2), `startDate`, `endDate` (YYYY-MM-DD), optional `title`.

**201:** `{ itinerary }`  
**422:** `{ errors }` field map

### `POST /api/itineraries/plan`

Prompt-first create: extract missing structured fields from free text (BYOK extract when a key is present, else heuristic), create a draft, then run generation with the user prompt.

**Body (JSON):** `email`, `prompt` (required); optional hints `travelerName`, `passportNationality`, `destinationCountry`, `startDate`, `endDate`, `title`.

**Headers (optional):** `X-BYOK-Key` — used for extract + generation (same as generate).

**201:** `{ itinerary, generation: { driver, searchParams } }`  
**422:** `{ errors }` when email/prompt invalid, or when required fields cannot be resolved (fail closed); may include `code` / `error` / `details` if generation fails after create (response may still include `itinerary`)  
**401:** `{ code: "BYOK", … }`

**Extract rules (fail closed):**
- Passport nationality is never invented. Heuristic only accepts known nationality phrases / codes; BYOK output is kept only when grounded in the user prompt (passport/nationality/citizen wording). Prefer optional details when ambiguous.
- Destination uses whole-phrase alias matching (so `uk` does not match inside `ukraine`) and ignores English stopwords like `in`/`to` as ISO codes.
- When generation fails after create, the API returns the draft `itinerary` with an error; the web UI stays on the form and links to the draft instead of auto-navigating away.

Flights, hotels, and days are **illustrative** (AI-plausible or mock) — not live bookings.

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

Query `variant=polished` or `variant=ticket`, or use the dedicated paths below.

**200:** `application/pdf` body  
**403:** `{ code: "LOCKED", … }` (polished while locked)  
**409:** `{ code: "NOT_GENERATED", … }`  
**404:** not found

### `GET /api/itineraries/:id/pdf/ticket?email=…`

Free **illustrative flight coupon** PDF (no premium unlock). Requires flight schedule from generation. Optional `leg=outbound|return|all` (default `all`).

Marked clearly as **not a valid ticket / boarding pass / booking**. Generic “Sample Carrier” branding only. Airport codes render as `---` when `originAirport` / `destinationAirport` are absent — the compiler does not invent IATA codes from city name prefixes.

**200:** `application/pdf`  
**409:** `{ code: "NOT_GENERATED", … }` when no flight schedule

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
