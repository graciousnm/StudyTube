import { z } from "zod";

export const youtubeSearchQuerySchema = z
  .string()
  .trim()
  .min(1, "Enter a search term.")
  .max(200, "Search must be 200 characters or fewer.");

export const youtubeVideoIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{11}$/, "Invalid YouTube video ID.");