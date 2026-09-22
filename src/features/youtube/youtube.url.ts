const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "");

  if (hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return VIDEO_ID_REGEX.test(id) ? id : null;
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_REGEX.test(v)) {
      return v;
    }

    const pathMatch = url.pathname.match(
      /^\/(embed|v|shorts)\/([A-Za-z0-9_-]{11})/,
    );
    if (pathMatch) {
      return pathMatch[2];
    }
  }

  return null;
}

function extractPlaylistId(raw: string): string | null {
  const trimmed = raw.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const list = url.searchParams.get("list");
  if (list && /^[A-Za-z0-9_-]+$/.test(list)) {
    return list;
  }

  return null;
}

export { extractVideoId, extractPlaylistId };
