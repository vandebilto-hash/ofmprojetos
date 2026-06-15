import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  icon?: LucideIcon;
}) {
  const toneClass = {
    neutral: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-100",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-100",
    danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-100"
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon ? (
          <span className={`rounded-md p-2 ${toneClass}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}
