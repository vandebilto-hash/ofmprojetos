import { clsx } from "clsx";

type Tone = "brand" | "success" | "warning" | "danger";

const trackClass: Record<Tone, string> = {
  brand: "bg-brand-100 dark:bg-brand-500/20",
  success: "bg-emerald-100 dark:bg-emerald-500/20",
  warning: "bg-amber-100 dark:bg-amber-500/20",
  danger: "bg-red-100 dark:bg-red-500/20"
};

const fillClass: Record<Tone, string> = {
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-danger"
};

function getTone(percent: number): Tone {
  if (percent >= 100) return "success";
  if (percent >= 70) return "brand";
  if (percent >= 40) return "warning";
  return "danger";
}

export function ProgressBar({
  value,
  max = 100,
  tone,
  showLabel = false,
  className
}: {
  value: number;
  max?: number;
  tone?: Tone;
  showLabel?: boolean;
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const resolvedTone = tone ?? getTone(percent);

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={clsx("h-1.5 flex-1 overflow-hidden rounded-full", trackClass[resolvedTone])}
      >
        <div
          className={clsx("h-full rounded-full transition-all duration-slow", fillClass[resolvedTone])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}
