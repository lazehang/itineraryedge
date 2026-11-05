/** Prompt-first create / plan extract shapes. */

export type PlanItineraryInput = {
  email: string;
  prompt: string;
  travelerName?: string;
  passportNationality?: string;
  destinationCountry?: string;
  startDate?: string;
  endDate?: string;
  title?: string;
};

export type PlanFieldErrors = Partial<
  Record<
    | "email"
    | "prompt"
    | "travelerName"
    | "passportNationality"
    | "destinationCountry"
    | "startDate"
    | "endDate"
    | "title",
    string
  >
>;

export type ExtractedPlanFields = {
  travelerName: string;
  passportNationality: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  title?: string;
};
