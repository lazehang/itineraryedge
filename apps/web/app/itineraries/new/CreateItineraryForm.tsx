"use client";

import { useActionState } from "react";
import {
  createItineraryAction,
  type CreateItineraryFormState,
} from "./actions";

const initialState: CreateItineraryFormState = {};

function fieldError(errors: Record<string, string> | undefined, key: string) {
  const message = errors?.[key];
  if (!message) return null;
  return (
    <p className="field-error" id={`${key}-error`} role="alert">
      {message}
    </p>
  );
}

export function CreateItineraryForm() {
  const [state, formAction, pending] = useActionState(createItineraryAction, initialState);
  const values = state.values ?? {};

  return (
    <form className="stack" action={formAction} noValidate>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values.email}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.errors?.email)}
        />
        {fieldError(state.errors, "email")}
      </div>

      <div className="field">
        <label htmlFor="travelerName">Traveler name</label>
        <input
          id="travelerName"
          name="travelerName"
          type="text"
          autoComplete="name"
          required
          defaultValue={values.travelerName}
          aria-describedby={state.errors?.travelerName ? "travelerName-error" : undefined}
          aria-invalid={Boolean(state.errors?.travelerName)}
        />
        {fieldError(state.errors, "travelerName")}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="passportNationality">Passport nationality (ISO alpha-2)</label>
          <input
            id="passportNationality"
            name="passportNationality"
            type="text"
            inputMode="text"
            autoComplete="country"
            required
            maxLength={2}
            placeholder="US"
            defaultValue={values.passportNationality}
            aria-describedby={
              state.errors?.passportNationality ? "passportNationality-error" : undefined
            }
            aria-invalid={Boolean(state.errors?.passportNationality)}
          />
          {fieldError(state.errors, "passportNationality")}
        </div>

        <div className="field">
          <label htmlFor="destinationCountry">Destination country (ISO alpha-2)</label>
          <input
            id="destinationCountry"
            name="destinationCountry"
            type="text"
            required
            maxLength={2}
            placeholder="JP"
            defaultValue={values.destinationCountry}
            aria-describedby={
              state.errors?.destinationCountry ? "destinationCountry-error" : undefined
            }
            aria-invalid={Boolean(state.errors?.destinationCountry)}
          />
          {fieldError(state.errors, "destinationCountry")}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={values.startDate}
            aria-describedby={state.errors?.startDate ? "startDate-error" : undefined}
            aria-invalid={Boolean(state.errors?.startDate)}
          />
          {fieldError(state.errors, "startDate")}
        </div>

        <div className="field">
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={values.endDate}
            aria-describedby={state.errors?.endDate ? "endDate-error" : undefined}
            aria-invalid={Boolean(state.errors?.endDate)}
          />
          {fieldError(state.errors, "endDate")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">
          Trip title <span className="muted">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          defaultValue={values.title}
          aria-describedby={state.errors?.title ? "title-error" : undefined}
          aria-invalid={Boolean(state.errors?.title)}
        />
        {fieldError(state.errors, "title")}
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving draft…" : "Save draft"}
      </button>
    </form>
  );
}
