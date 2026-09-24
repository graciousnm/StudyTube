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

export const youtubePageTokenSchema = z
  .string()
  .trim()
  .min(1, "Invalid page token.")
  .max(512, "Invalid page token.");

export const youtubeThumbnailUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (url) => {
      try {
        const hostname = new URL(url).hostname;
        return (
          hostname === "ytimg.com" || hostname.endsWith(".ytimg.com")
        );
      } catch {
        return false;
      }
    },
    "Thumbnail URL must point to the ytimg.com CDN.",
  );