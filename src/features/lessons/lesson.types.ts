export interface LessonCreateInput {
  youtube_video_id: string;
  youtube_title?: string | null;
  youtube_channel_id?: string | null;
  youtube_channel_name?: string | null;
  youtube_thumbnail_url?: string | null;
  youtube_duration?: number | null;
  youtube_description?: string | null;
  youtube_published_at?: Date | null;
}

export interface LessonActionState {
  error?: string;
  success?: boolean;
}

export type MoveDirection = "up" | "down";
