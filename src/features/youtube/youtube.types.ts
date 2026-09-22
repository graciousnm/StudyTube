export interface YouTubeVideo {
  youtubeVideoId: string;
  title: string;
  channelId: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  description: string | null;
  publishedAt: Date | null;
}

export interface YouTubeSearchResult {
  youtubeVideoId: string;
  title: string;
  channelId: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  description: string | null;
  publishedAt: string | null;
}
