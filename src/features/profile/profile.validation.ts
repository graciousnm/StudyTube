import { z } from "zod";
import type { ProfileActionState } from "./profile.types";

export const learnerNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(60, "Name must be 60 characters or fewer.");

export function parseProfileName(
  formData: FormData,
):
  | { success: true; data: string }
  | {
      success: false;
      fieldErrors: NonNullable<ProfileActionState["fieldErrors"]>;
    } {
  const parsed = learnerNameSchema.safeParse(formData.get("name"));
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const fieldErrors: NonNullable<ProfileActionState["fieldErrors"]> = {};
  const messages: string[] = [];
  for (const issue of parsed.error.issues) {
    messages.push(issue.message);
  }
  fieldErrors.name = messages;
  return { success: false, fieldErrors };
}