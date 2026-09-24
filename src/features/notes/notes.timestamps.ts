export interface NoteTimestamp {
  text: string;
  seconds: number;
}

export interface NoteSegment {
  type: "text" | "timestamp";
  text: string;
  seconds?: number;
}

const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;

function toSeconds(match: RegExpMatchArray): number | null {
  if (match[3]) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    return minutes > 59 || seconds > 59 ? null : hours * 3600 + minutes * 60 + seconds;
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return seconds > 59 ? null : minutes * 60 + seconds;
}

export function parseNoteTimestamps(content: string): NoteTimestamp[] {
  const timestamps: NoteTimestamp[] = [];
  TIMESTAMP_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(TIMESTAMP_PATTERN)) {
    const seconds = toSeconds(match);
    if (seconds === null) continue;
    timestamps.push({ text: match[0], seconds });
  }
  return timestamps;
}

export function segmentNoteContent(content: string): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let lastIndex = 0;
  TIMESTAMP_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(TIMESTAMP_PATTERN)) {
    const seconds = toSeconds(match);
    if (seconds === null) continue;

    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: "timestamp", text: match[0], seconds });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", text: content.slice(lastIndex) });
  }

  if (segments.length === 0 && content.length > 0) {
    segments.push({ type: "text", text: content });
  }

  return segments;
}