import type { ExtractedPlanFields } from "@itineraryedge/shared";
import { normalizeCountryCode } from "@itineraryedge/shared";
import type { Env } from "../index.js";
import { resolveByokKey } from "./drivers/factory.js";

const DATE = /\b(20\d{2}-\d{2}-\d{2})\b/g;

/**
 * Known destination / nationality ISO codes we will accept from extract.
 * Structured optional details may still pass any ISO alpha-2 via mergePlanHints.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  japan: "JP",
  tokyo: "JP",
  france: "FR",
  paris: "FR",
  italy: "IT",
  rome: "IT",
  spain: "ES",
  madrid: "ES",
  germany: "DE",
  berlin: "DE",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  london: "GB",
  "united states": "US",
  usa: "US",
  america: "US",
  korea: "KR",
  "south korea": "KR",
  seoul: "KR",
  china: "CN",
  beijing: "CN",
  singapore: "SG",
  thailand: "TH",
  bangkok: "TH",
  australia: "AU",
  sydney: "AU",
  canada: "CA",
  mexico: "MX",
  brazil: "BR",
  india: "IN",
  "hong kong": "HK",
  taiwan: "TW",
  taipei: "TW",
  netherlands: "NL",
  amsterdam: "NL",
  switzerland: "CH",
  dubai: "AE",
  uae: "AE",
  ukraine: "UA",
};

const KNOWN_ISO = new Set(Object.values(COUNTRY_ALIASES));

/** English 2-letter tokens that must not be treated as destination ISO codes. */
const ISO_DESTINATION_STOPWORDS = new Set([
  "AM",
  "AN",
  "AS",
  "AT",
  "BE",
  "BY",
  "DO",
  "HE",
  "IF",
  "IN",
  "IS",
  "ME",
  "MY",
  "NO",
  "OF",
  "ON",
  "OR",
  "PM",
  "SO",
  "TO",
  "WE",
]);

/** Tokens rejected before "passport" (e.g. "my passport"). */
const PASSPORT_PREFIX_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "her",
  "his",
  "its",
  "my",
  "no",
  "of",
  "our",
  "the",
  "their",
  "this",
  "your",
]);

const NAME_PATTERNS = [
  /\b(?:for|I'm|I am|my name is|traveler(?:'s)? name(?: is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:traveling|travelling|visiting|going)\b/,
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-phrase match so short aliases like "uk" do not match inside "ukraine". */
function includesAlias(haystackLower: string, alias: string): boolean {
  const escaped = escapeRegExp(alias);
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(haystackLower);
}

function resolveKnownIso(token: string): string | undefined {
  const alias = token.trim().toLowerCase();
  if (COUNTRY_ALIASES[alias]) {
    return COUNTRY_ALIASES[alias];
  }
  const code = normalizeCountryCode(alias);
  if (/^[A-Z]{2}$/.test(code) && KNOWN_ISO.has(code)) {
    return code;
  }
  return undefined;
}

function extractDates(prompt: string): string[] {
  const matches = [...prompt.matchAll(DATE)].map((m) => m[1]!).filter(Boolean);
  return [...new Set(matches)].sort();
}

function extractDestination(prompt: string): string | undefined {
  const lower = prompt.toLowerCase();
  const ranked = Object.entries(COUNTRY_ALIASES)
    .filter(([alias]) => includesAlias(lower, alias))
    .sort((a, b) => b[0].length - a[0].length);
  if (ranked[0]) {
    return ranked[0][1];
  }

  const codes = [...prompt.toUpperCase().matchAll(/\b([A-Z]{2})\b/g)]
    .map((m) => m[1]!)
    .filter((code) => KNOWN_ISO.has(code) && !ISO_DESTINATION_STOPWORDS.has(code));
  return codes[0];
}

function extractTravelerName(prompt: string): string | undefined {
  for (const pattern of NAME_PATTERNS) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractPassportHint(prompt: string): string | undefined {
  const lower = prompt.toLowerCase();
  const patterns: Array<{ re: RegExp; group: number }> = [
    { re: /\b([a-z]{2})\s+passport\b/, group: 1 },
    { re: /\bpassport\s+(?:nationality|country)?\s*(?:is\s+|:)?\s*([a-z]{2})\b/, group: 1 },
    { re: /\bpassport\s+(?:from|of)\s+([a-z][a-z\s]{1,24})/, group: 1 },
    { re: /\bnationality\s+(?:is\s+|:)?\s*([a-z][a-z\s]{1,24})/, group: 1 },
    { re: /\bcitizen\s+of\s+([a-z][a-z\s]{1,24})/, group: 1 },
  ];

  for (const { re, group } of patterns) {
    const match = lower.match(re);
    const raw = match?.[group]?.trim();
    if (!raw) {
      continue;
    }
    if (PASSPORT_PREFIX_STOPWORDS.has(raw.split(/\s+/)[0] ?? "")) {
      continue;
    }
    const resolved = resolveKnownIso(raw);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
}

/** Require passport nationality to appear in the user text (or near passport wording). */
export function isPassportNationalityGrounded(prompt: string, code: string): boolean {
  const normalized = normalizeCountryCode(code);
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return false;
  }
  const hint = extractPassportHint(prompt);
  if (hint === normalized) {
    return true;
  }
  if (!/\b(passport|nationality|citizen)\b/i.test(prompt)) {
    return false;
  }
  const lower = prompt.toLowerCase();
  if (new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i").test(prompt)) {
    return true;
  }
  for (const [alias, mapped] of Object.entries(COUNTRY_ALIASES)) {
    if (mapped === normalized && includesAlias(lower, alias)) {
      return true;
    }
  }
  return false;
}

export function isDestinationCountryGrounded(prompt: string, code: string): boolean {
  const normalized = normalizeCountryCode(code);
  if (!/^[A-Z]{2}$/.test(normalized) || !KNOWN_ISO.has(normalized)) {
    // Allow any ISO from structured hints path; for AI extract we only trust known map
    // unless the exact code appears as a whole word and is not a stopword.
    if (!/^[A-Z]{2}$/.test(normalized) || ISO_DESTINATION_STOPWORDS.has(normalized)) {
      return false;
    }
    return new RegExp(`\\b${escapeRegExp(normalized)}\\b`).test(prompt.toUpperCase());
  }
  const lower = prompt.toLowerCase();
  for (const [alias, mapped] of Object.entries(COUNTRY_ALIASES)) {
    if (mapped === normalized && includesAlias(lower, alias)) {
      return true;
    }
  }
  if (ISO_DESTINATION_STOPWORDS.has(normalized)) {
    return false;
  }
  return new RegExp(`\\b${escapeRegExp(normalized)}\\b`).test(prompt.toUpperCase());
}

/** Deterministic heuristic extract — never invents passport nationality silently. */
export function extractPlanFieldsHeuristic(prompt: string): Partial<ExtractedPlanFields> {
  const dates = extractDates(prompt);
  const destinationCountry = extractDestination(prompt);
  const travelerName = extractTravelerName(prompt);
  const passportNationality = extractPassportHint(prompt);

  const out: Partial<ExtractedPlanFields> = {};
  if (travelerName) {
    out.travelerName = travelerName;
  }
  if (passportNationality) {
    out.passportNationality = passportNationality;
  }
  if (destinationCountry) {
    out.destinationCountry = destinationCountry;
  }
  if (dates[0]) {
    out.startDate = dates[0];
  }
  if (dates[1]) {
    out.endDate = dates[1];
  }
  return out;
}

async function extractPlanFieldsWithByok(
  prompt: string,
  apiKey: string,
  provider: string,
): Promise<Partial<ExtractedPlanFields>> {
  const system = `Extract travel planning fields from the user prompt. Return JSON only with keys:
travelerName, passportNationality (ISO alpha-2), destinationCountry (ISO alpha-2), startDate, endDate (YYYY-MM-DD), title (optional).
Omit any key you cannot determine confidently from the prompt text.
Never invent a passport nationality or destination country that is not clearly stated.`;

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 400,
        messages: [{ role: "user", content: `${system}\n\nPrompt:\n${prompt}` }],
      }),
    });
    if (!response.ok) {
      return extractPlanFieldsHeuristic(prompt);
    }
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    return parseExtractJson(text, prompt) ?? extractPlanFieldsHeuristic(prompt);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });
  if (!response.ok) {
    return extractPlanFieldsHeuristic(prompt);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseExtractJson(text, prompt) ?? extractPlanFieldsHeuristic(prompt);
}

export function parseExtractJson(
  text: string,
  prompt: string,
): Partial<ExtractedPlanFields> | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return null;
    }
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const out: Partial<ExtractedPlanFields> = {};
    if (typeof raw.travelerName === "string" && raw.travelerName.trim()) {
      out.travelerName = raw.travelerName.trim();
    }
    if (typeof raw.passportNationality === "string") {
      const code = normalizeCountryCode(raw.passportNationality);
      if (/^[A-Z]{2}$/.test(code) && isPassportNationalityGrounded(prompt, code)) {
        out.passportNationality = code;
      }
    }
    if (typeof raw.destinationCountry === "string") {
      const code = normalizeCountryCode(raw.destinationCountry);
      if (/^[A-Z]{2}$/.test(code) && isDestinationCountryGrounded(prompt, code)) {
        out.destinationCountry = code;
      }
    }
    if (typeof raw.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)) {
      out.startDate = raw.startDate;
    }
    if (typeof raw.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.endDate)) {
      out.endDate = raw.endDate;
    }
    if (typeof raw.title === "string" && raw.title.trim()) {
      out.title = raw.title.trim().slice(0, 200);
    }
    return out;
  } catch {
    return null;
  }
}

export async function extractPlanFields(
  request: Request,
  env: Env,
  prompt: string,
): Promise<Partial<ExtractedPlanFields>> {
  const apiKey = resolveByokKey(request, env);
  if (!apiKey) {
    return extractPlanFieldsHeuristic(prompt);
  }
  const provider = (env.AI_PROVIDER ?? "openai").toLowerCase();
  return extractPlanFieldsWithByok(prompt, apiKey, provider);
}
