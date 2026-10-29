import {
  assertTripSpanAllowsGeneration,
  runSameDayGuards,
  validateGenerationBundle,
  type GenerationBundle,
  type TravelItinerary,
} from "@itineraryedge/shared";
import { buildGenerationContext } from "./context.js";
import { ByokAuthError, DriverOutputError, type GenerationDriver } from "./drivers/types.js";

export type GenerationSuccess = {
  ok: true;
  bundle: GenerationBundle;
  driver: string;
};

export type GenerationFailure = {
  ok: false;
  code: "VALIDATION" | "SAME_DAY" | "BYOK";
  message: string;
  details?: string[];
};

export async function runItineraryGeneration(input: {
  payload: TravelItinerary;
  destinationCountry: string;
  driver: GenerationDriver;
}): Promise<GenerationSuccess | GenerationFailure> {
  const context = buildGenerationContext(input.payload, input.destinationCountry);
  if (!context) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Itinerary payload is missing a stay segment with dates.",
    };
  }

  const preAiSpan = assertTripSpanAllowsGeneration(context.startDate, context.endDate);
  if (!preAiSpan.ok) {
    return {
      ok: false,
      code: "SAME_DAY",
      message: preAiSpan.message,
    };
  }

  let bundle: GenerationBundle;
  try {
    bundle = await input.driver.generate(context);
  } catch (error) {
    if (error instanceof ByokAuthError) {
      return {
        ok: false,
        code: "BYOK",
        message: error.message,
      };
    }
    if (error instanceof DriverOutputError) {
      return {
        ok: false,
        code: "VALIDATION",
        message: "AI output failed schema validation.",
        details: error.errors,
      };
    }
    return {
      ok: false,
      code: "VALIDATION",
      message: "Generation failed unexpectedly.",
    };
  }

  const validated = validateGenerationBundle(bundle);
  if (!validated.ok) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Generated JSON did not pass strict validation.",
      details: validated.errors,
    };
  }

  const sameDay = runSameDayGuards({
    startDate: context.startDate,
    endDate: context.endDate,
    sightseeingTimeline: bundle.sightseeingTimeline,
    flightSchedule: bundle.flightSchedule,
  });

  if (!sameDay.ok) {
    return {
      ok: false,
      code: "SAME_DAY",
      message: sameDay.message,
    };
  }

  return { ok: true, bundle, driver: input.driver.name };
}
