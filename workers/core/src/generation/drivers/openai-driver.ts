import {
  validateGenerationBundle,
  type GenerationBundle,
} from "@itineraryedge/shared";
import type { ItineraryGenerationContext } from "../context.js";
import { buildGenerationPrompt } from "./prompt.js";
import { ByokAuthError, DriverOutputError, type GenerationDriver } from "./types.js";

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new DriverOutputError(["AI response did not contain JSON."]);
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    throw new DriverOutputError(["AI response JSON could not be parsed."]);
  }
}

export function createOpenAiDriver(apiKey: string): GenerationDriver {
  return {
    name: "openai",
    async generate(context: ItineraryGenerationContext): Promise<GenerationBundle> {
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
            {
              role: "system",
              content: "You produce strict JSON travel artifacts for visa-support itineraries.",
            },
            {
              role: "user",
              content: buildGenerationPrompt(context),
            },
          ],
          temperature: 0.2,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new ByokAuthError();
      }

      if (!response.ok) {
        throw new DriverOutputError([`OpenAI request failed (${response.status}).`]);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new DriverOutputError(["OpenAI returned an empty completion."]);
      }

      const parsed = extractJsonObject(content) as Record<string, unknown>;
      const candidate = {
        searchParams: parsed.searchParams,
        flightSchedule: parsed.flightSchedule,
        hotelInventory: parsed.hotelInventory,
        sightseeingTimeline: parsed.sightseeingTimeline,
      };

      const validated = validateGenerationBundle(candidate);
      if (!validated.ok) {
        throw new DriverOutputError(validated.errors);
      }

      return candidate as GenerationBundle;
    },
  };
}
