import { z } from "zod";
import { parseIsoDuration, youtubeGet } from "./youtube.api";
import { YouTubeError } from "./youtube.errors";
import type { YouTubeVideo } from "./youtube.types";

const SEARCH_MAX_RESULTS = 12;

const snippetSchema = z.object({
  title: z.string(),
  channelId: z.string().optional(),
  channelTitle: z.string().optional(),
  description: z.string().optional(),
  publishedAt: z.string().optional(),
  thumbnails: z
    .record(z.string(), z.object({ url: z.string() }))
    .optional(),
});

const searchResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.object({ videoId: z.string() }).optional(),
        snippet: snippetSchema.optional(),
      }),
    )
    .default([]),
});

const videosResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: snippetSchema.optional(),
        contentDetails: z
          .object({ duration: z.string().optional() })
          .optional(),
      }),
    )
    .default([]),
});

function bestThumbnail(
  thumbnails?: Record<string, { url: string }>,
): string | null {
  if (!thumbnails) {
    return null;
  }
  return (
    thumbnails.medium?.url ??
    thumbnails.high?.url ??
    thumbnails.default?.url ??
    null
  );
}

function normalizeSnippet(
  videoId: string,
  snippet: z.infer<typeof snippetSchema> | undefined,
  durationSeconds: number | null,
): YouTubeVideo {
  return {
    youtubeVideoId: videoId,
    title: snippet?.title ?? videoId,
    channelId: snippet?.channelId ?? null,
    channelName: snippet?.channelTitle ?? null,
    thumbnailUrl: bestThumbnail(snippet?.thumbnails),
    durationSeconds,
    description: snippet?.description ?? null,
    publishedAt: snippet?.publishedAt ? new Date(snippet.publishedAt) : null,
  };
}

function normalizeSearchItem(
  item: z.infer<typeof searchResponseSchema>["items"][number],
  durations: Map<string, number | null>,
): YouTubeVideo | null {
  const videoId = item.id?.videoId;
  if (!videoId) {
    return null;
  }
  return normalizeSnippet(videoId, item.snippet, durations.get(videoId) ?? null);
}

function normalizeVideoItem(
  item: z.infer<typeof videosResponseSchema>["items"][number],
): YouTubeVideo {
  return normalizeSnippet(
    item.id,
    item.snippet,
    parseIsoDuration(item.contentDetails?.duration),
  );
}

export async function fetchDurations(
  videoIds: string[],
): Promise<Map<string, number | null>> {
  const json = await youtubeGet("videos", {
    part: "contentDetails",
    id: videoIds.join(","),
  });
  const parsed = videosResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }

  const durations = new Map<string, number | null>();
  for (const item of parsed.data.items) {
    durations.set(item.id, parseIsoDuration(item.contentDetails?.duration));
  }
  return durations;
}

export async function searchYouTube(
  query: string,
  pageToken?: string,
): Promise<{ items: YouTubeVideo[]; nextPageToken: string | null }> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    maxResults: String(SEARCH_MAX_RESULTS),
    q: query,
  };
  if (pageToken) {
    params.pageToken = pageToken;
  }
  const json = await youtubeGet("search", params);
  const parsed = searchResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }

  const items = parsed.data.items.filter((item) => item.id?.videoId);
  const videoIds = items.map((item) => item.id!.videoId);
  const durations =
    videoIds.length > 0
      ? await fetchDurations(videoIds)
      : new Map<string, number | null>();

  const nextPageToken =
    json && typeof json === "object" && "nextPageToken" in json
      ? (json as { nextPageToken?: string }).nextPageToken ?? null
      : null;

  return {
    items: items
      .map((item) => normalizeSearchItem(item, durations))
      .filter((video): video is YouTubeVideo => video !== null),
    nextPageToken,
  };
}

export async function getVideoMetadata(
  youtubeVideoId: string,
): Promise<YouTubeVideo> {
  const json = await youtubeGet("videos", {
    part: "snippet,contentDetails",
    id: youtubeVideoId,
  });
  const parsed = videosResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }

  const item = parsed.data.items[0];
  if (!item) {
    throw new YouTubeError(
      "video_unavailable",
      "This video is unavailable on YouTube.",
    );
  }
  return normalizeVideoItem(item);
}