import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, { icon: string; badge: string }> = {
  neutral: {
    icon: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-100",
    badge: ""
  },
  success: {
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100",
    badge: "text-emerald-600 dark:text-emerald-400"
  },
  warning: {
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-100",
    badge: "text-amber-600 dark:text-amber-400"
  },
  danger: {
    icon: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-100",
    badge: "text-red-600 dark:text-red-400"
  }
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon,
  trend
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
  icon?: LucideIcon;
  trend?: { direction: "up" | "down" | "flat"; label?: string };
}) {
  const styles = toneStyles[tone];

  const TrendIcon =
    trend?.direction === "up" ? TrendingUp :
    trend?.direction === "down" ? TrendingDown : Minus;

  const trendColor =
    trend?.direction === "up" ? "text-emerald-600 dark:text-emerald-400" :
    trend?.direction === "down" ? "text-red-600 dark:text-red-400" :
    "text-slate-500";

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft transition-shadow hover:shadow-card dark:bg-[#111c31]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className={clsx("shrink-0 rounded-md p-2", styles.icon)}>
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-ink dark:text-white">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {detail && <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
        {trend && (
          <span className={clsx("ml-auto flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon size={12} aria-hidden="true" />
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
