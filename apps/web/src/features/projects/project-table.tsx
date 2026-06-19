import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { DialogAction } from "@/components/ui/dialog-action";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatHours, formatMoney } from "@/lib/format";
import { deleteProjectAction } from "@/server/actions/projects";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  currentEnd: Date;
  progressPercent: unknown;
  plannedHours: unknown;
  actualHours: unknown;
  financialCost: unknown;
  client: { name: string };
  manager: { name: string };
};

function ManagerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <span
      title={name}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
      aria-label={name}
    >
      {initials}
    </span>
  );
}

export function ProjectTable({ projects, canManage = false }: { projects: ProjectRow[]; canManage?: boolean }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="Nenhum projeto encontrado"
        description="Crie um novo projeto ou ajuste os filtros para ver resultados."
        action={canManage ? { label: "Novo projeto", href: "/projects/new" } : undefined}
      />
    );
  }

  const now = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft dark:bg-[#111c31]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line bg-slate-50 dark:bg-slate-800/40">
            <tr>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Projeto</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Gestor</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fim</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[140px]">Avanço</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Horas</th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Custo</th>
              {canManage && <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {projects.map((project) => {
              const delayed = project.currentEnd < now && project.status !== "COMPLETED";
              const progress = Number(project.progressPercent);
              return (
                <tr
                  key={project.id}
                  className={
                    delayed
                      ? "bg-red-50/50 dark:bg-red-500/5"
                      : "transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                  }
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      {project.name}
                    </Link>
                    {delayed && (
                      <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                        Atrasado
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{project.client.name}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ManagerAvatar name={project.manager.name} />
                      <span className="text-slate-600 dark:text-slate-400">{project.manager.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                    {formatDate(project.currentEnd)}
                  </td>
                  <td className="px-3 py-3">
                    <ProgressBar value={progress} showLabel />
                  </td>
                  <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                    {formatHours(project.actualHours)}/{formatHours(project.plannedHours)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {formatMoney(project.financialCost)}
                  </td>
                  {canManage && (
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Abrir
                        </Link>
                        <DialogAction
                          title="Excluir projeto"
                          description={`Deseja realmente excluir "${project.name}"? Essa ação remove tarefas, baselines, bloqueios e todo o histórico vinculado.`}
                          trigger="delete"
                        >
                          <form action={deleteProjectAction} className="grid gap-4">
                            <input type="hidden" name="projectId" value={project.id} />
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                              Esta exclusão não pode ser desfeita.
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="submit"
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                              >
                                Sim, excluir projeto
                              </button>
                            </div>
                          </form>
                        </DialogAction>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {projects.length} projeto{projects.length !== 1 ? "s" : ""} listado{projects.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
