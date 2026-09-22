import { z } from "zod";
import { youtubeGet } from "./youtube.api";
import { YouTubeError } from "./youtube.errors";
import { fetchDurations } from "./youtube.search";
import type { YouTubeSearchResult } from "./youtube.types";

const PLAYLIST_MAX_RESULTS = 50;

const playlistItemSchema = z.object({
  snippet: z
    .object({
      title: z.string().optional(),
      resourceId: z
        .object({ videoId: z.string().optional() })
        .optional(),
      channelId: z.string().optional(),
      channelTitle: z.string().optional(),
      description: z.string().optional(),
      publishedAt: z.string().optional(),
      thumbnails: z
        .record(z.string(), z.object({ url: z.string() }))
        .optional(),
    })
    .optional(),
});

const playlistResponseSchema = z.object({
  items: z.array(playlistItemSchema).default([]),
  nextPageToken: z.string().optional(),
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

export async function getPlaylistItems(
  playlistId: string,
  pageToken?: string,
): Promise<{ items: YouTubeSearchResult[]; nextPageToken: string | null }> {
  const params: Record<string, string> = {
    part: "snippet",
    playlistId,
    maxResults: String(PLAYLIST_MAX_RESULTS),
  };
  if (pageToken) {
    params.pageToken = pageToken;
  }

  const json = await youtubeGet("playlistItems", params);
  const parsed = playlistResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }

  const rawItems = parsed.data.items.filter(
    (item) => item.snippet?.resourceId?.videoId,
  );

  const videoIds = rawItems.map(
    (item) => item.snippet!.resourceId!.videoId!,
  );
  const durations =
    videoIds.length > 0
      ? await fetchDurations(videoIds)
      : new Map<string, number | null>();

  const items: YouTubeSearchResult[] = rawItems.map((item) => {
    const snippet = item.snippet!;
    const videoId = snippet.resourceId!.videoId!;
    return {
      youtubeVideoId: videoId,
      title: snippet.title ?? videoId,
      channelId: snippet.channelId ?? null,
      channelName: snippet.channelTitle ?? null,
      thumbnailUrl: bestThumbnail(snippet.thumbnails),
      durationSeconds: durations.get(videoId) ?? null,
      description: snippet.description ?? null,
      publishedAt: snippet.publishedAt ?? null,
    };
  });

  return {
    items,
    nextPageToken: parsed.data.nextPageToken ?? null,
  };
}
