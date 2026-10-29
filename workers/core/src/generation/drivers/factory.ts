import type { Env } from "../../index.js";
import { createAnthropicDriver } from "./anthropic-driver.js";
import { createOpenAiDriver } from "./openai-driver.js";
import { mockGenerationDriver } from "./mock-driver.js";
import type { GenerationDriver } from "./types.js";

const BYOK_HEADER = "X-BYOK-Key";

export function resolveByokKey(request: Request, env: Env): string | null {
  const headerKey = request.headers.get(BYOK_HEADER)?.trim();
  if (headerKey) {
    return headerKey;
  }

  const envKey = env.BYOK_AI_KEY?.trim();
  return envKey || null;
}

export function createGenerationDriver(request: Request, env: Env): GenerationDriver {
  const apiKey = resolveByokKey(request, env);
  if (!apiKey) {
    return mockGenerationDriver;
  }

  const provider = (env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider === "anthropic") {
    return createAnthropicDriver(apiKey);
  }

  return createOpenAiDriver(apiKey);
}

export { BYOK_HEADER };
