import { AlertCircle, BriefcaseBusiness, Clock3, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { prisma } from "@/lib/prisma/client";
import { formatHours, formatMoney } from "@/lib/format";

export async function DashboardPage({ role, userId, clientId }: { role: string; userId: string; clientId?: string | null }) {
  const projectWhere =
    role === "CLIENT"
      ? { clientId: clientId ?? "__none__" }
      : role === "PROJECT_MANAGER"
        ? { managerId: userId }
        : {};

  const [projects, clients, tasks, resourceUsers] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: { client: true, manager: true, tasks: true, blockers: true }
    }),
    prisma.client.count(),
    prisma.task.findMany({
      where:
        role === "EMPLOYEE"
          ? {
              OR: [{ ownerId: userId }, { participants: { some: { userId } } }]
            }
          : role === "CLIENT"
            ? { project: { clientId: clientId ?? "__none__" } }
            : {},
      include: { project: true }
    }),
    prisma.user.findMany({
      include: {
        allocations: { include: { task: true } },
        ownedTasks: { include: { project: true } }
      }
    })
  ]);

  const now = new Date();
  const delayedProjects = projects.filter((project) => project.currentEnd < now && project.status !== "COMPLETED");
  const delayedTasks = tasks.filter((task) => task.plannedEnd < now && task.status !== "DONE");
  const plannedHours = projects.reduce((sum, project) => sum + Number(project.plannedHours), 0);
  const actualHours = projects.reduce((sum, project) => sum + Number(project.actualHours), 0);
  const totalCost = projects.reduce((sum, project) => sum + Number(project.financialCost), 0);
  const overAllocated = resourceUsers.filter(
    (user) => allocatedHoursForDashboard(user) > Number(user.weeklyCapacityHours)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Indicadores operacionais ajustados ao seu perfil de acesso.
        </p>
      </div>

      <section className="grid grid-cols-4 gap-4">
        <MetricCard label="Projetos" value={projects.length} detail="Total visivel" icon={BriefcaseBusiness} />
        <MetricCard label="Clientes" value={role === "ADMIN" ? clients : projects.length ? 1 : 0} icon={UsersRound} />
        <MetricCard label="Tarefas atrasadas" value={delayedTasks.length} tone="danger" icon={AlertCircle} />
        <MetricCard label="Horas realizadas" value={formatHours(actualHours)} detail={`${formatHours(plannedHours)} planejadas`} icon={Clock3} />
      </section>

      <section className="mt-6 grid grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Saude dos projetos</h2>
            <span className="text-sm text-slate-500">{delayedProjects.length} atrasados</span>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Projeto</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Avanco</th>
                  <th className="px-3 py-2">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.map((project) => (
                  <tr key={project.id} className={project.currentEnd < now && project.status !== "COMPLETED" ? "bg-red-50/60" : ""}>
                    <td className="px-3 py-3 font-medium">{project.name}</td>
                    <td className="px-3 py-3">{project.client.name}</td>
                    <td className="px-3 py-3">{Number(project.progressPercent)}%</td>
                    <td className="px-3 py-3">{formatMoney(project.financialCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Alertas</h2>
          <div className="mt-4 grid gap-3">
            {overAllocated.length ? (
              <div className="flex items-center gap-3 rounded-md border border-red-200/70 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
                <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-300" />
                <span>{overAllocated.length} funcionario(s) sobrealocado(s)</span>
              </div>
            ) : null}
            {delayedTasks.length ? (
              <div className="flex items-center gap-3 rounded-md border border-amber-200/70 bg-amber-50/70 p-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertCircle size={16} className="shrink-0 text-amber-500 dark:text-amber-300" />
                <span>{delayedTasks.length} tarefa(s) exigem replanejamento</span>
              </div>
            ) : null}
            {!overAllocated.length && !delayedTasks.length ? (
              <p className="rounded-md border border-line p-3 text-sm text-slate-500">
                Nenhum alerta operacional no momento.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function allocatedHoursForDashboard(user: {
  allocations: Array<{ task: { id: string; estimatedHours: unknown } | null }>;
  ownedTasks: Array<{ id: string; estimatedHours: unknown }>;
}) {
  const representedTaskIds = new Set<string>();
  let total = 0;

  for (const allocation of user.allocations) {
    if (!allocation.task) continue;
    representedTaskIds.add(allocation.task.id);
    total += Number(allocation.task.estimatedHours);
  }

  for (const task of user.ownedTasks) {
    if (representedTaskIds.has(task.id)) continue;
    total += Number(task.estimatedHours);
  }

  return total;
}
