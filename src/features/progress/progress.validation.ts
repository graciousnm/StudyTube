import { z } from "zod";

export const lessonCompletionInputSchema = z.object({
  lessonId: z.number().int().positive(),
  completed: z.boolean(),
});

export const MAX_PLAYBACK_POSITION_SECONDS = 86_400;

export const playbackPositionInputSchema = z.object({
  lessonId: z.number().int().positive(),
  position: z
    .number()
    .finite()
    .min(0)
    .max(MAX_PLAYBACK_POSITION_SECONDS),
  duration: z.number().finite().positive().nullable().optional(),
});