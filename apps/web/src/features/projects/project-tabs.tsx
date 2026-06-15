import Link from "next/link";

const tabs = [
  ["overview", "Home"],
  ["governance", "Governanca"],
  ["emails", "E-mails"],
  ["minutes", "Atas"],
  ["documents", "Planos"],
  ["milestones", "Marcos"],
  ["gantt", "Planejamento"],
  ["tasks", "To-do"],
  ["blockers", "Riscos e pendencias"],
  ["dashboard", "Dashboard"],
  ["portal", "Portal cliente"],
  ["logs", "Logs"]
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map(([key, label]) => {
        const href = key === "overview" ? `/projects/${projectId}` : `/projects/${projectId}/${key}`;
        return (
          <Link
            key={key}
            href={href}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
