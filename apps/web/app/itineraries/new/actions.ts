"use server";

import { redirect } from "next/navigation";
import { createItinerary } from "@/lib/core-api";

export type CreateItineraryFormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export async function createItineraryAction(
  _prev: CreateItineraryFormState,
  formData: FormData,
): Promise<CreateItineraryFormState> {
  const values = {
    email: String(formData.get("email") ?? ""),
    travelerName: String(formData.get("travelerName") ?? ""),
    passportNationality: String(formData.get("passportNationality") ?? ""),
    destinationCountry: String(formData.get("destinationCountry") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    title: String(formData.get("title") ?? ""),
  };

  const result = await createItinerary({
    email: values.email,
    travelerName: values.travelerName,
    passportNationality: values.passportNationality,
    destinationCountry: values.destinationCountry,
    startDate: values.startDate,
    endDate: values.endDate,
    title: values.title.trim() ? values.title : undefined,
  });

  if (!result.ok) {
    return { errors: result.errors, values };
  }

  const email = encodeURIComponent(values.email.trim().toLowerCase());
  redirect(`/itineraries/${result.itinerary.id}?email=${email}`);
}
