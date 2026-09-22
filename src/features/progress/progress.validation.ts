import { z } from "zod";

export const lessonCompletionInputSchema = z.object({
  lessonId: z.number().int().positive(),
  completed: z.boolean(),
});

export const playbackPositionInputSchema = z.object({
  lessonId: z.number().int().positive(),
  position: z.number().finite().min(0),
  duration: z.number().finite().positive().nullable().optional(),
});