import { YouTubeError } from "./youtube.errors";

const API_BASE = "https://www.googleapis.com/youtube/v3";

export function getYouTubeApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new YouTubeError(
      "not_configured",
      "YouTube search is not configured on this StudyTube installation.",
    );
  }
  return key;
}

export function parseIsoDuration(
  value: string | null | undefined,
): number | null {
  if (!value) {
    return null;
  }
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) {
    return null;
  }
  const [, days, hours, minutes, seconds] = match;
  if (!days && !hours && !minutes && !seconds) {
    return null;
  }
  const total =
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0);
  return Number.isFinite(total) ? total : null;
}

function userMessage(
  status: number,
  reason: string | undefined,
): { code: YouTubeError["code"]; message: string } {
  if (status === 400 && reason === "keyInvalid") {
    return {
      code: "invalid_key",
      message:
        "YouTube search is not configured correctly on this StudyTube installation.",
    };
  }
  if (
    status === 403 &&
    (reason === "quotaExceeded" || reason === "dailyLimitExceeded")
  ) {
    return {
      code: "quota_exceeded",
      message: "YouTube search quota has been reached.",
    };
  }
  if (status === 404) {
    return {
      code: "playlist_not_found",
      message: "Playlist not found or is private.",
    };
  }
  return {
    code: "temporarily_unavailable",
    message: "YouTube search is temporarily unavailable.",
  };
}

async function errorFromResponse(response: Response): Promise<YouTubeError> {
  let reason: string | undefined;
  try {
    const body = await response.json();
    reason = body?.error?.errors?.[0]?.reason;
  } catch {
    reason = undefined;
  }
  console.error(
    `[youtube] API request failed: ${response.status}${reason ? ` (${reason})` : ""}`,
  );
  const mapped = userMessage(response.status, reason);
  return new YouTubeError(mapped.code, mapped.message);
}

export async function youtubeGet(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", getYouTubeApiKey());

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  try {
    return await response.json();
  } catch {
    throw new YouTubeError(
      "temporarily_unavailable",
      "YouTube search is temporarily unavailable.",
    );
  }
}