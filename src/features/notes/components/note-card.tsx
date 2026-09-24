"use client";

import { segmentNoteContent } from "@/features/notes/notes.timestamps";

interface NoteCardProps {
  content: string;
  createdAt: Date;
  updatedAt: Date;
  onSeek?: (seconds: number) => void;
}

export function NoteCard({
  content,
  createdAt,
  updatedAt,
  onSeek,
}: NoteCardProps) {
  const displayDate =
    updatedAt.getTime() !== createdAt.getTime()
      ? `Edited ${updatedAt.toLocaleDateString()}`
      : `Created ${createdAt.toLocaleDateString()}`;

  const segments = segmentNoteContent(content);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <p className="whitespace-pre-wrap text-sm text-zinc-300">
        {segments.map((segment, index) =>
          segment.type === "timestamp" && onSeek ? (
            <button
              key={index}
              type="button"
              onClick={() => onSeek(segment.seconds ?? 0)}
              className="rounded bg-brand/15 px-1.5 font-semibold tabular-nums text-brand hover:bg-brand/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              title={`Seek to ${segment.text}`}
            >
              {segment.text}
            </button>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{displayDate}</p>
    </div>
  );
}