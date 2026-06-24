import { DialogAction } from "@/components/ui/dialog-action";
import { formatHours, formatMoney } from "@/lib/format";
import { deleteResourceAction, updateResourceAction } from "@/server/actions/projects";

type User = {
  id: string;
  name: string;
  jobTitle?: string | null;
  weeklyCapacityHours: unknown;
  dailyCapacityHours: unknown;
  hourlyRate?: unknown;
  allocations: {
    allocatedHours: unknown;
    project: { name: string };
    task?: { id: string; name: string; estimatedHours: unknown } | null;
  }[];
  ownedTasks?: { id: string; name: string; estimatedHours: unknown; project: { name: string } }[];
};

function resourceWorkload(user: User) {
  const representedTaskIds = new Set<string>();
  const items = user.allocations.filter((allocation) => allocation.task).map((allocation) => {
    if (allocation.task?.id) representedTaskIds.add(allocation.task.id);
    return {
      hours: Number(allocation.task?.estimatedHours ?? allocation.allocatedHours),
      label: `${allocation.project.name} / ${allocation.task?.name ?? "Tarefa nao vinculada"}`
    };
  });

  for (const task of user.ownedTasks ?? []) {
    if (representedTaskIds.has(task.id)) continue;
    items.push({
      hours: Number(task.estimatedHours),
      label: `${task.project.name} / ${task.name}`
    });
  }

  return items;
}

export function ResourceMatrix({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-soft">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Funcionario</th>
            <th className="px-3 py-3">Capacidade semanal</th>
            <th className="px-3 py-3">Taxa/hora</th>
            <th className="px-3 py-3">Horas alocadas</th>
            <th className="px-3 py-3">Custo estimado</th>
            <th className="px-3 py-3">Horas livres</th>
            <th className="px-3 py-3">Projetos e tarefas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((user) => {
            const workload = resourceWorkload(user);
            const allocated = workload.reduce((sum, item) => sum + item.hours, 0);
            const capacity = Number(user.weeklyCapacityHours);
            const hourlyRate = Number(user.hourlyRate ?? 0);
            const impactedProjects = [...new Set(workload.map((item) => item.label.split(" / ")[0]))];
            const over = allocated > capacity;
            return (
              <tr
                key={user.id}
                className={
                  over
                    ? "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-100"
                    : "dark:text-slate-100"
                }
              >
                <td className="px-3 py-3 font-semibold">
                  <div className="grid gap-2">
                    <span className={over ? "inline-flex w-fit items-center rounded-md bg-red-100 px-2 py-1 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40" : ""}>
                      {user.name}
                    </span>
                    <div className="flex gap-2">
                      <DialogAction title="Editar recurso" description={user.name} trigger="edit">
                        <form action={updateResourceAction} className="grid gap-4">
                          <input type="hidden" name="userId" value={user.id} />
                          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nome <span className="text-red-500">*</span>
                            <input name="name" required defaultValue={user.name} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                          </label>
                          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                            Cargo
                            <input name="jobTitle" defaultValue={user.jobTitle ?? ""} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="Cargo" />
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                              Capacidade semanal
                              <input name="weeklyCapacityHours" type="number" step="0.01" defaultValue={Number(user.weeklyCapacityHours)} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                              Capacidade diária
                              <input name="dailyCapacityHours" type="number" step="0.01" defaultValue={Number(user.dailyCapacityHours)} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                              Taxa por hora
                              <input name="hourlyRate" type="number" step="0.01" defaultValue={hourlyRate} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                            </label>
                          </div>
                          <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                              Salvar
                            </button>
                          </div>
                        </form>
                      </DialogAction>
                      <DialogAction title="Excluir recurso" description="Ao excluir, o recurso sera removido das alocacoes e deixara de ser responsavel pelas tarefas vinculadas." trigger="delete">
                        <form action={deleteResourceAction} className="grid gap-4">
                          <input type="hidden" name="userId" value={user.id} />
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <p className="font-bold">Este recurso vai sumir dos seguintes projetos:</p>
                            <p className="mt-2">{impactedProjects.length ? impactedProjects.join(", ") : "Nenhum projeto vinculado."}</p>
                            <p className="mt-2">As alocacoes serao removidas e as tarefas ficarao sem responsavel.</p>
                          </div>
                          <button className="w-fit justify-self-end rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir recurso</button>
                        </form>
                      </DialogAction>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{formatHours(capacity)}</td>
                <td className="px-3 py-3">{formatMoney(hourlyRate)}</td>
                <td className={over ? "px-3 py-3 font-semibold text-red-700 dark:text-red-200" : "px-3 py-3"}>
                  {formatHours(allocated)}
                </td>
                <td className="px-3 py-3 font-semibold text-ink">{formatMoney(allocated * hourlyRate)}</td>
                <td className={over ? "px-3 py-3 font-semibold text-red-700 dark:text-red-200" : "px-3 py-3"}>
                  {formatHours(Math.max(0, capacity - allocated))}
                </td>
                <td className="max-w-[360px] whitespace-normal px-3 py-3 text-xs leading-5">
                  {workload.map((item) => `${item.label} (${formatHours(item.hours)})`).join(", ") || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
