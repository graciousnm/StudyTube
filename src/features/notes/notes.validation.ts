import { z } from "zod";
import { MAX_NOTE_LENGTH, type NoteActionState } from "./notes.types";

export const noteContentSchema = z
  .string()
  .trim()
  .min(1, "Note cannot be empty.")
  .max(MAX_NOTE_LENGTH, "Note must be 10,000 characters or fewer.");

export function parseNoteInput(
  formData: FormData,
):
  | { success: true; data: { content: string } }
  | {
      success: false;
      fieldErrors: NonNullable<NoteActionState["fieldErrors"]>;
    } {
  const parsed = noteContentSchema.safeParse(formData.get("content"));
  if (parsed.success) {
    return { success: true, data: { content: parsed.data } };
  }

  const fieldErrors: NonNullable<NoteActionState["fieldErrors"]> = {};
  for (const issue of parsed.error.issues) {
    const messages = fieldErrors.content ?? [];
    messages.push(issue.message);
    fieldErrors.content = messages;
  }
  return { success: false, fieldErrors };
}