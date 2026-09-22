import { z } from "zod";
import type { ModuleActionState } from "./module.types";

export const moduleInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5,000 characters or fewer.")
    .default(""),
});

export const moduleIdSchema = z.coerce.number().int().positive();

function readModuleInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  };
}

export function parseModuleInput(
  formData: FormData,
):
  | { success: true; data: z.infer<typeof moduleInputSchema> }
  | {
      success: false;
      fieldErrors: NonNullable<ModuleActionState["fieldErrors"]>;
    } {
  const parsed = moduleInputSchema.safeParse(readModuleInput(formData));
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const fieldErrors: NonNullable<ModuleActionState["fieldErrors"]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (key === "title" || key === "description") {
      const messages = fieldErrors[key] ?? [];
      messages.push(issue.message);
      fieldErrors[key] = messages;
    }
  }
  return { success: false, fieldErrors };
}
