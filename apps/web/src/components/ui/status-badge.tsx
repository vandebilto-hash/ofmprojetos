import { clsx } from "clsx";
import { priorityLabel, statusLabel } from "@/lib/labels";

const statusMap: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/25 dark:text-blue-100 dark:ring-blue-400/50",
  BLOCKED: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/25 dark:text-red-100 dark:ring-red-400/50",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-400/50",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-400/50",
  CANCELED: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-500",
  TODO: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500",
  IN_REVIEW: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/25 dark:text-violet-100 dark:ring-violet-400/50",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-400/50",
  LOW: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500",
  MEDIUM: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/25 dark:text-blue-100 dark:ring-blue-400/50",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-400/50",
  CRITICAL: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/25 dark:text-red-100 dark:ring-red-400/50",
  OPEN: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-400/50",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-400/50",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-400/50",
  INACTIVE: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-500"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
        statusMap[status] ?? "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500"
      )}
    >
      {priorityLabel(status) !== status.replaceAll("_", " ") ? priorityLabel(status) : statusLabel(status)}
    </span>
  );
}
