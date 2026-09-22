interface ProgressBarProps {
  percent: number | null;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, label, className }: ProgressBarProps) {
  const value =
    percent === null ? 0 : Math.min(100, Math.max(0, Math.round(percent)));
  const fillClassName = value >= 100 ? "bg-success" : "bg-brand";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className ?? ""}`}
    >
      <div
        className={`h-full rounded-full transition-[width] ${fillClassName}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}