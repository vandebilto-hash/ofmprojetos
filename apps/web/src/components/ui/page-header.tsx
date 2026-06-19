import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  action?: {
    href?: string;
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    variant?: "primary" | "secondary";
  };
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, breadcrumb, action, actions }: PageHeaderProps) {
  const variant = action?.variant ?? "primary";
  const btnClass =
    variant === "primary"
      ? "inline-flex h-9 items-center gap-2 rounded-md bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      : "inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:bg-[#111c31] dark:text-white dark:hover:bg-slate-800";

  return (
    <div className="mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {actions ?? (
          action && (
            action.href ? (
              <Link href={action.href} className={btnClass}>
                {action.icon && <action.icon size={15} aria-hidden="true" />}
                {action.label}
              </Link>
            ) : (
              <button onClick={action.onClick} className={btnClass}>
                {action.icon && <action.icon size={15} aria-hidden="true" />}
                {action.label}
              </button>
            )
          )
        )}
      </div>
    </div>
  );
}
