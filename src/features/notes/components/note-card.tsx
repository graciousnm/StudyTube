interface NoteCardProps {
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function NoteCard({ content, createdAt, updatedAt }: NoteCardProps) {
  const displayDate =
    updatedAt.getTime() !== createdAt.getTime()
      ? `Edited ${updatedAt.toLocaleDateString()}`
      : `Created ${createdAt.toLocaleDateString()}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <p className="whitespace-pre-wrap text-sm text-zinc-300">{content}</p>
      <p className="mt-2 text-xs text-zinc-500">{displayDate}</p>
    </div>
  );
}