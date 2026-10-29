import { DriverOutputError } from "./types.js";

export function extractJsonObject(text: string): unknown {
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
