import type { GenerationFlightSchedule, GenerationSightseeingTimeline } from "./generation-types";

export type SameDayGuardResult =
  | { ok: true }
  | { ok: false; message: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(time: string): number | null {
  if (!TIME.test(time)) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Reject same-day international trips (start === end). */
export function assertTripSpanAllowsGeneration(
  startDate: string,
  endDate: string,
): SameDayGuardResult {
  if (startDate === endDate) {
    return {
      ok: false,
      message:
        "Same-day start and end dates cannot support an open-mode flight and sightseeing timeline.",
    };
  }
  return { ok: true };
}

function activitiesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Detect overlapping sightseeing blocks and impossible same-day flight vs activity ordering. */
export function assertSightseeingTimelineFeasible(
  timeline: GenerationSightseeingTimeline,
  flightSchedule?: GenerationFlightSchedule,
): SameDayGuardResult {
  for (const day of timeline.days) {
    const ranges: Array<{ start: number; end: number; title: string }> = [];

    for (const item of day.items) {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      if (start === null || end === null) {
        return { ok: false, message: `Invalid time on ${day.date} for "${item.title}".` };
      }

      for (const existing of ranges) {
        if (activitiesOverlap(start, end, existing.start, existing.end)) {
          return {
            ok: false,
            message: `Overlapping activities on ${day.date}: "${existing.title}" and "${item.title}".`,
          };
        }
      }

      ranges.push({ start, end, title: item.title });
    }
  }

  if (flightSchedule) {
    const outbound = flightSchedule.segments.find((s) => s.direction === "outbound");
    if (outbound) {
      const arrivalMinutes = timeToMinutes(outbound.arriveTime);
      if (arrivalMinutes !== null && outbound.arriveDate === outbound.departDate) {
        const day = timeline.days.find((d) => d.date === outbound.arriveDate);
        if (day) {
          for (const item of day.items) {
            const start = timeToMinutes(item.startTime);
            if (start !== null && start < arrivalMinutes + 90) {
              return {
                ok: false,
                message: `Activity "${item.title}" on ${day.date} starts before outbound arrival plus buffer.`,
              };
            }
          }
        }
      }
    }
  }

  return { ok: true };
}

export function runSameDayGuards(input: {
  startDate: string;
  endDate: string;
  sightseeingTimeline: GenerationSightseeingTimeline;
  flightSchedule?: GenerationFlightSchedule;
}): SameDayGuardResult {
  const span = assertTripSpanAllowsGeneration(input.startDate, input.endDate);
  if (!span.ok) {
    return span;
  }

  return assertSightseeingTimelineFeasible(input.sightseeingTimeline, input.flightSchedule);
}
