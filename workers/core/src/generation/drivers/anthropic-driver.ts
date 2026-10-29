import {
  validateGenerationBundle,
  type GenerationBundle,
} from "@itineraryedge/shared";
import type { ItineraryGenerationContext } from "../context.js";
import { extractJsonObject } from "./extract-json.js";
import { buildGenerationPrompt } from "./prompt.js";
import { ByokAuthError, DriverOutputError, type GenerationDriver } from "./types.js";

export function createAnthropicDriver(apiKey: string): GenerationDriver {
  return {
    name: "anthropic",
    async generate(context: ItineraryGenerationContext): Promise<GenerationBundle> {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: buildGenerationPrompt(context),
            },
          ],
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new ByokAuthError();
      }

      if (!response.ok) {
        throw new DriverOutputError([`Anthropic request failed (${response.status}).`]);
      }

      const payload = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };

      const textBlock = payload.content?.find((block) => block.type === "text");
      const content = textBlock?.text;
      if (!content) {
        throw new DriverOutputError(["Anthropic returned an empty completion."]);
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
