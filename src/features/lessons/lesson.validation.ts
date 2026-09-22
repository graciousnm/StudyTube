import { z } from "zod";

export const lessonIdSchema = z.coerce.number().int().positive();
