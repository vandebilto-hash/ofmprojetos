import Link from "next/link";
import { DialogAction } from "@/components/ui/dialog-action";
import { StatusBadge } from "@/components/ui/status-badge";
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

export function ProjectTable({ projects, canManage = false }: { projects: ProjectRow[]; canManage?: boolean }) {
  const now = new Date();
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Projeto</th>
            <th className="px-3 py-3">Cliente</th>
            <th className="px-3 py-3">Gestor</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Fim atual</th>
            <th className="px-3 py-3">Avanco</th>
            <th className="px-3 py-3">Horas</th>
            <th className="px-3 py-3">Custo</th>
            {canManage ? <th className="px-3 py-3 text-right">Acoes</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {projects.map((project) => {
            const delayed = project.currentEnd < now && project.status !== "COMPLETED";
            return (
              <tr key={project.id} className={delayed ? "bg-red-50/60" : ""}>
                <td className="px-3 py-3 font-semibold text-brand-700">
                  <Link href={`/projects/${project.id}`}>{project.name}</Link>
                </td>
                <td className="px-3 py-3">{project.client.name}</td>
                <td className="px-3 py-3">{project.manager.name}</td>
                <td className="px-3 py-3"><StatusBadge status={project.status} /></td>
                <td className="px-3 py-3">{formatDate(project.currentEnd)}</td>
                <td className="px-3 py-3">{Number(project.progressPercent)}%</td>
                <td className="px-3 py-3">{formatHours(project.actualHours)} / {formatHours(project.plannedHours)}</td>
                <td className="px-3 py-3">{formatMoney(project.financialCost)}</td>
                {canManage ? (
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <DialogAction
                        title="Excluir projeto"
                        description={`Deseja realmente excluir "${project.name}"? Essa acao remove tarefas, baselines, bloqueios, documentos e historico vinculado ao projeto.`}
                        trigger="delete"
                      >
                        <form action={deleteProjectAction} className="grid gap-4">
                          <input type="hidden" name="projectId" value={project.id} />
                          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            Essa exclusao nao pode ser desfeita.
                          </div>
                          <div className="flex justify-end gap-2">
                            <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                              Sim, excluir projeto
                            </button>
                          </div>
                        </form>
                      </DialogAction>
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
