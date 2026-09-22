export type YouTubeErrorCode =
  | "not_configured"
  | "invalid_key"
  | "quota_exceeded"
  | "video_unavailable"
  | "playlist_not_found"
  | "temporarily_unavailable";

export class YouTubeError extends Error {
  readonly code: YouTubeErrorCode;

  constructor(code: YouTubeErrorCode, message: string) {
    super(message);
    this.name = "YouTubeError";
    this.code = code;
  }
}

export function youTubeErrorMessage(error: unknown): string {
  if (error instanceof YouTubeError) {
    return error.message;
  }
  return "YouTube is temporarily unavailable.";
}