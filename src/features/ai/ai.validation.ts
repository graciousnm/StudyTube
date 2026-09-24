import { z } from "zod";
import {
  youtubeSearchQuerySchema,
  youtubeVideoIdSchema,
} from "@/features/youtube/youtube.validation";

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

const moduleTopicsSchema = z.object({
  moduleId: z.number().int().positive(),
  title: z
    .string()
    .trim()
    .min(1, "Module title is required.")
    .max(200, "Module title must be 200 characters or fewer."),
  topics: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Topic cannot be empty.")
        .max(200, "Topic must be 200 characters or fewer."),
    )
    .min(1, "Module must have at least one topic.")
    .max(50, "Module must have 50 or fewer topics."),
});

export const curateVideosInputSchema = z.object({
  courseTitle: z
    .string()
    .trim()
    .min(1, "Course title is required.")
    .max(200, "Course title must be 200 characters or fewer."),
  courseDescription: z
    .string()
    .trim()
    .max(5000, "Course description must be 5,000 characters or fewer.")
    .default(""),
  modules: z
    .array(moduleTopicsSchema)
    .min(1, "Course must have at least one module.")
    .max(20, "Course must have 20 or fewer modules."),
  channel: z
    .string()
    .trim()
    .max(200, "Channel preference must be 200 characters or fewer.")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Curation notes must be 1,000 characters or fewer.")
    .optional(),
});

const searchQuerySchema = z.object({
  moduleIndex: z.number().int().min(0),
  topicIndex: z.number().int().min(0),
  query: youtubeSearchQuerySchema,
});

export const searchQueriesSchema = z
  .array(searchQuerySchema)
  .min(1, "At least one search query is required.")
  .max(200, "Too many search queries.");

const videoResultSchema = z.object({
  youtubeVideoId: youtubeVideoIdSchema,
  title: z.string().trim().max(200, "Title must be 200 characters or fewer."),
  channelName: z.string().nullable(),
  durationSeconds: z.number().int().min(0).nullable(),
});

const topicSearchResultsSchema = z.object({
  moduleIndex: z.number().int().min(0),
  topicIndex: z.number().int().min(0),
  query: youtubeSearchQuerySchema,
  results: z.array(videoResultSchema).max(5, "Too many results."),
});

export const topicsWithResultsSchema = z
  .array(topicSearchResultsSchema)
  .min(1, "At least one topic result is required.")
  .max(200, "Too many topic results.");

const curatedVideoSchema = z.object({
  moduleId: z.number().int().positive(),
  videoId: youtubeVideoIdSchema,
});

export const curatedVideosSchema = z
  .array(curatedVideoSchema)
  .min(1, "At least one video is required.")
  .max(200, "Too many videos.");

export type CurateVideosInputValidated = z.infer<
  typeof curateVideosInputSchema
>;
export type SearchQueriesValidated = z.infer<typeof searchQueriesSchema>;
export type TopicsWithResultsValidated = z.infer<
  typeof topicsWithResultsSchema
>;
export type CuratedVideosValidated = z.infer<typeof curatedVideosSchema>;
