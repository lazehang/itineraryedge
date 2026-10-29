import type { GenerationBundle } from "@itineraryedge/shared";
import type { ItineraryGenerationContext } from "../context.js";

export type GenerationDriver = {
  readonly name: string;
  generate(context: ItineraryGenerationContext): Promise<GenerationBundle>;
};

export class ByokAuthError extends Error {
  constructor(message = "The supplied BYOK key was rejected by the AI provider.") {
    super(message);
    this.name = "ByokAuthError";
  }
}

export class DriverOutputError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join(" "));
    this.name = "DriverOutputError";
    this.errors = errors;
  }
}
