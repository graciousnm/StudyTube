import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center sm:p-10">
      {icon ? (
        <div className="mx-auto mb-3 h-8 w-8 text-zinc-600">{icon}</div>
      ) : null}
      <h3 className="text-lg font-medium text-zinc-100">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      ) : null}
      {children ? <div className="mt-6 flex flex-col items-center gap-3">{children}</div> : null}
    </div>
  );
}
