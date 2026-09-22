import { z } from "zod";

const topicSchema = z
  .string()
  .trim()
  .min(1, "Topic cannot be empty.")
  .max(200, "Topic must be 200 characters or fewer.");

const moduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Module title is required.")
    .max(200, "Module title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Module description must be 5,000 characters or fewer.")
    .default(""),
  topics: z
    .array(topicSchema)
    .min(1, "Module must have at least one topic.")
    .max(50, "Module must have 50 or fewer topics."),
});

export const courseOutlineSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Course title is required.")
    .max(200, "Course title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Course description must be 5,000 characters or fewer.")
    .default(""),
  modules: z
    .array(moduleSchema)
    .min(1, "Course must have at least one module.")
    .max(20, "Course must have 20 or fewer modules."),
});

export const generateOutlineInputSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(1, "Learning goal is required.")
    .max(1000, "Learning goal must be 1,000 characters or fewer."),
  experience: z
    .string()
    .trim()
    .max(1000, "Experience must be 1,000 characters or fewer.")
    .optional(),
  detail: z.enum(["short", "standard", "detailed"]),
});

export type CourseOutlineValidated = z.infer<typeof courseOutlineSchema>;
export type GenerateOutlineInputValidated = z.infer<
  typeof generateOutlineInputSchema
>;
