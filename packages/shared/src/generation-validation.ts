import { GENERATION_SCHEMA_VERSION, type GenerationSearchParams } from "./generation-types";
import type {
  GenerationFlightSchedule,
  GenerationHotelInventory,
  GenerationSightseeingTimeline,
  SightseeingDay,
  SightseeingItem,
} from "./generation-types";

const ISO_ALPHA2 = /^[A-Z]{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CATEGORIES = new Set(["culture", "food", "nature", "transit", "rest"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  obj: Record<string, unknown>,
  key: string,
  errors: string[],
  label: string,
): string | null {
  const value = obj[key];
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label}.${key} must be a non-empty string.`);
    return null;
  }
  return value.trim();
}

function readSchemaVersion(obj: Record<string, unknown>, errors: string[]): boolean {
  if (obj.schemaVersion !== GENERATION_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be "${GENERATION_SCHEMA_VERSION}".`);
    return false;
  }
  return true;
}

export function validateSearchParams(raw: unknown): {
  ok: true;
  value: GenerationSearchParams;
} | {
  ok: false;
  errors: string[];
} {
  if (!isRecord(raw)) {
    return { ok: false, errors: ["search_params must be an object."] };
  }

  const errors: string[] = [];
  readSchemaVersion(raw, errors);

  const destinationCountry = readString(raw, "destinationCountry", errors, "search_params");
  if (destinationCountry && !ISO_ALPHA2.test(destinationCountry.toUpperCase())) {
    errors.push("search_params.destinationCountry must be ISO alpha-2.");
  }

  const originCountry = readString(raw, "originCountry", errors, "search_params");
  if (originCountry && !ISO_ALPHA2.test(originCountry.toUpperCase())) {
    errors.push("search_params.originCountry must be ISO alpha-2.");
  }

  const startDate = readString(raw, "startDate", errors, "search_params");
  if (startDate && !DATE.test(startDate)) {
    errors.push("search_params.startDate must be YYYY-MM-DD.");
  }

  const endDate = readString(raw, "endDate", errors, "search_params");
  if (endDate && !DATE.test(endDate)) {
    errors.push("search_params.endDate must be YYYY-MM-DD.");
  }

  if (startDate && endDate && startDate > endDate) {
    errors.push("search_params.endDate must be on or after startDate.");
  }

  readString(raw, "travelerName", errors, "search_params");

  let focusAreas: string[] = [];
  if (!Array.isArray(raw.focusAreas)) {
    errors.push("search_params.focusAreas must be an array of strings.");
  } else {
    focusAreas = raw.focusAreas.filter((item): item is string => typeof item === "string");
    if (focusAreas.length === 0) {
      errors.push("search_params.focusAreas must include at least one entry.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      destinationCountry: destinationCountry!.toUpperCase(),
      originCountry: originCountry!.toUpperCase(),
      startDate: startDate!,
      endDate: endDate!,
      travelerName: (raw.travelerName as string).trim(),
      focusAreas,
    },
  };
}

function parseSightseeingItem(raw: unknown, prefix: string, errors: string[]): SightseeingItem | null {
  if (!isRecord(raw)) {
    errors.push(`${prefix} must be an object.`);
    return null;
  }

  const startTime = readString(raw, "startTime", errors, prefix);
  const endTime = readString(raw, "endTime", errors, prefix);
  if (startTime && !TIME.test(startTime)) {
    errors.push(`${prefix}.startTime must be HH:MM (24h).`);
  }
  if (endTime && !TIME.test(endTime)) {
    errors.push(`${prefix}.endTime must be HH:MM (24h).`);
  }
  if (startTime && endTime && TIME.test(startTime) && TIME.test(endTime) && startTime >= endTime) {
    errors.push(`${prefix} endTime must be after startTime.`);
  }

  readString(raw, "title", errors, prefix);
  readString(raw, "place", errors, prefix);

  const category = readString(raw, "category", errors, prefix);
  if (category && !CATEGORIES.has(category)) {
    errors.push(`${prefix}.category is invalid.`);
  }

  if (errors.length > 0) {
    return null;
  }

  return {
    startTime: startTime!,
    endTime: endTime!,
    title: (raw.title as string).trim(),
    place: (raw.place as string).trim(),
    category: category as SightseeingItem["category"],
  };
}

function parseSightseeingDay(raw: unknown, index: number, errors: string[]): SightseeingDay | null {
  const prefix = `sightseeing_itinerary.days[${index}]`;
  if (!isRecord(raw)) {
    errors.push(`${prefix} must be an object.`);
    return null;
  }

  const date = readString(raw, "date", errors, prefix);
  if (date && !DATE.test(date)) {
    errors.push(`${prefix}.date must be YYYY-MM-DD.`);
  }
  readString(raw, "theme", errors, prefix);

  const items: SightseeingItem[] = [];
  if (!Array.isArray(raw.items)) {
    errors.push(`${prefix}.items must be an array.`);
  } else if (raw.items.length === 0) {
    errors.push(`${prefix}.items must include at least one activity.`);
  } else {
    raw.items.forEach((item, itemIndex) => {
      const parsed = parseSightseeingItem(item, `${prefix}.items[${itemIndex}]`, errors);
      if (parsed) {
        items.push(parsed);
      }
    });
  }

  if (!date || !raw.theme) {
    return null;
  }

  return {
    date,
    theme: (raw.theme as string).trim(),
    items,
  };
}

export function validateSightseeingTimeline(raw: unknown): {
  ok: true;
  value: GenerationSightseeingTimeline;
} | {
  ok: false;
  errors: string[];
} {
  if (!isRecord(raw)) {
    return { ok: false, errors: ["sightseeing_itinerary must be an object."] };
  }

  const errors: string[] = [];
  readSchemaVersion(raw, errors);

  const days: SightseeingDay[] = [];
  if (!Array.isArray(raw.days)) {
    errors.push("sightseeing_itinerary.days must be an array.");
  } else if (raw.days.length === 0) {
    errors.push("sightseeing_itinerary.days must include at least one day.");
  } else {
    raw.days.forEach((day, index) => {
      const parsed = parseSightseeingDay(day, index, errors);
      if (parsed) {
        days.push(parsed);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schemaVersion: GENERATION_SCHEMA_VERSION,
      days,
    },
  };
}

export function validateFlightSchedule(raw: unknown): {
  ok: true;
  value: GenerationFlightSchedule;
} | {
  ok: false;
  errors: string[];
} {
  if (!isRecord(raw)) {
    return { ok: false, errors: ["flight_schedule must be an object."] };
  }

  const errors: string[] = [];
  readSchemaVersion(raw, errors);

  if (!Array.isArray(raw.segments) || raw.segments.length < 2) {
    errors.push("flight_schedule.segments must include outbound and return legs.");
  } else {
    raw.segments.forEach((segment, index) => {
      const prefix = `flight_schedule.segments[${index}]`;
      if (!isRecord(segment)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      const direction = readString(segment, "direction", errors, prefix);
      if (direction && direction !== "outbound" && direction !== "return") {
        errors.push(`${prefix}.direction must be outbound or return.`);
      }
      readString(segment, "carrier", errors, prefix);
      readString(segment, "flightNumber", errors, prefix);
      readString(segment, "origin", errors, prefix);
      readString(segment, "destination", errors, prefix);
      const departDate = readString(segment, "departDate", errors, prefix);
      const arriveDate = readString(segment, "arriveDate", errors, prefix);
      if (departDate && !DATE.test(departDate)) {
        errors.push(`${prefix}.departDate must be YYYY-MM-DD.`);
      }
      if (arriveDate && !DATE.test(arriveDate)) {
        errors.push(`${prefix}.arriveDate must be YYYY-MM-DD.`);
      }
      const departTime = readString(segment, "departTime", errors, prefix);
      const arriveTime = readString(segment, "arriveTime", errors, prefix);
      if (departTime && !TIME.test(departTime)) {
        errors.push(`${prefix}.departTime must be HH:MM.`);
      }
      if (arriveTime && !TIME.test(arriveTime)) {
        errors.push(`${prefix}.arriveTime must be HH:MM.`);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: raw as unknown as GenerationFlightSchedule,
  };
}

export function validateHotelInventory(raw: unknown): {
  ok: true;
  value: GenerationHotelInventory;
} | {
  ok: false;
  errors: string[];
} {
  if (!isRecord(raw)) {
    return { ok: false, errors: ["hotel_inventory must be an object."] };
  }

  const errors: string[] = [];
  readSchemaVersion(raw, errors);

  if (!Array.isArray(raw.hotels) || raw.hotels.length === 0) {
    errors.push("hotel_inventory.hotels must include at least one hotel.");
  } else {
    raw.hotels.forEach((hotel, index) => {
      const prefix = `hotel_inventory.hotels[${index}]`;
      if (!isRecord(hotel)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      readString(hotel, "name", errors, prefix);
      readString(hotel, "city", errors, prefix);
      const checkIn = readString(hotel, "checkIn", errors, prefix);
      const checkOut = readString(hotel, "checkOut", errors, prefix);
      if (checkIn && !DATE.test(checkIn)) {
        errors.push(`${prefix}.checkIn must be YYYY-MM-DD.`);
      }
      if (checkOut && !DATE.test(checkOut)) {
        errors.push(`${prefix}.checkOut must be YYYY-MM-DD.`);
      }
      if (typeof hotel.starRating !== "number" || hotel.starRating < 1 || hotel.starRating > 5) {
        errors.push(`${prefix}.starRating must be between 1 and 5.`);
      }
      if (typeof hotel.nightlyRateUsd !== "number" || hotel.nightlyRateUsd < 0) {
        errors.push(`${prefix}.nightlyRateUsd must be a non-negative number.`);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: raw as unknown as GenerationHotelInventory,
  };
}

export function validateGenerationBundle(raw: {
  searchParams: unknown;
  flightSchedule: unknown;
  hotelInventory: unknown;
  sightseeingTimeline: unknown;
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const search = validateSearchParams(raw.searchParams);
  if (!search.ok) {
    errors.push(...search.errors);
  }

  const flights = validateFlightSchedule(raw.flightSchedule);
  if (!flights.ok) {
    errors.push(...flights.errors);
  }

  const hotels = validateHotelInventory(raw.hotelInventory);
  if (!hotels.ok) {
    errors.push(...hotels.errors);
  }

  const sightseeing = validateSightseeingTimeline(raw.sightseeingTimeline);
  if (!sightseeing.ok) {
    errors.push(...sightseeing.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
