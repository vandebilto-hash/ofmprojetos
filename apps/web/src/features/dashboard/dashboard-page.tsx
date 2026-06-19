import { AlertCircle, BriefcaseBusiness, Clock3, UsersRound, CheckCircle2, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma/client";
import { formatHours, formatMoney } from "@/lib/format";
import Link from "next/link";

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
          ? { OR: [{ ownerId: userId }, { participants: { some: { userId } } }] }
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
  const delayedProjects = projects.filter((p) => p.currentEnd < now && p.status !== "COMPLETED");
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");
  const delayedTasks = tasks.filter((t) => t.plannedEnd < now && t.status !== "DONE");
  const doneTasks = tasks.filter((t) => t.status === "DONE");
  const plannedHours = projects.reduce((sum, p) => sum + Number(p.plannedHours), 0);
  const actualHours = projects.reduce((sum, p) => sum + Number(p.actualHours), 0);
  const overAllocated = resourceUsers.filter(
    (user) => allocatedHoursForDashboard(user) > Number(user.weeklyCapacityHours)
  );

  const hoursPercent = plannedHours > 0 ? Math.round((actualHours / plannedHours) * 100) : 0;
  const tasksDonePercent = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const alerts = [
    ...overAllocated.map((u) => ({
      type: "danger" as const,
      message: `${u.name} está sobrealcado`
    })),
    ...delayedProjects.map((p) => ({
      type: "warning" as const,
      message: `Projeto "${p.name}" está atrasado`
    })),
    ...delayedTasks.slice(0, 3).map((t) => ({
      type: "warning" as const,
      message: `Tarefa "${t.name}" precisa de replanejamento`
    }))
  ].slice(0, 6);

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Indicadores operacionais ajustados ao seu perfil de acesso.
        </p>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Métricas gerais">
        <MetricCard
          label="Projetos ativos"
          value={projects.length - completedProjects.length}
          detail={`${completedProjects.length} concluídos`}
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Tarefas concluídas"
          value={`${tasksDonePercent}%`}
          detail={`${doneTasks.length} de ${tasks.length}`}
          icon={CheckCircle2}
          tone={tasksDonePercent >= 70 ? "success" : tasksDonePercent >= 40 ? "neutral" : "warning"}
        />
        <MetricCard
          label="Tarefas atrasadas"
          value={delayedTasks.length}
          tone={delayedTasks.length > 0 ? "danger" : "success"}
          icon={AlertCircle}
          detail={delayedTasks.length === 0 ? "Tudo em dia" : "Requer atenção"}
        />
        <MetricCard
          label="Horas realizadas"
          value={formatHours(actualHours)}
          detail={`${formatHours(plannedHours)} planejadas`}
          icon={Clock3}
          tone={hoursPercent > 100 ? "danger" : "neutral"}
          trend={hoursPercent > 100 ? { direction: "up", label: `+${hoursPercent - 100}%` } : undefined}
        />
      </section>

      {/* Main content */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]" aria-label="Visão geral">
        {/* Projects health */}
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink dark:text-white">Saúde dos projetos</h2>
            <div className="flex items-center gap-3">
              {delayedProjects.length > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {delayedProjects.length} atrasado{delayedProjects.length > 1 ? "s" : ""}
                </span>
              )}
              <Link href="/projects" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-100/80">
                Ver todos →
              </Link>
            </div>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={BriefcaseBusiness}
              title="Nenhum projeto ainda"
              description="Crie seu primeiro projeto para começar a acompanhar o progresso."
              action={{ label: "Novo projeto", href: "/projects/new" }}
            />
          ) : (
            <div className="overflow-hidden rounded-md border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Projeto</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Avanço</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.slice(0, 8).map((project) => {
                    const isDelayed = project.currentEnd < now && project.status !== "COMPLETED";
                    const progress = Number(project.progressPercent);
                    return (
                      <tr
                        key={project.id}
                        className={isDelayed ? "bg-red-50/40 dark:bg-red-500/5" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"}
                      >
                        <td className="px-3 py-3">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium text-ink hover:text-brand-600 dark:text-white dark:hover:text-brand-100"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{project.client.name}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="px-3 py-3 min-w-[120px]">
                          <ProgressBar value={progress} showLabel />
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                          {formatMoney(project.financialCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts panel */}
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink dark:text-white">Alertas</h2>
            {alerts.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="rounded-full bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Tudo em ordem</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Nenhum alerta operacional.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  role="alert"
                  className={
                    alert.type === "danger"
                      ? "flex items-start gap-2.5 rounded-md border border-red-200/70 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
                      : "flex items-start gap-2.5 rounded-md border border-amber-200/70 bg-amber-50/70 p-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300"
                  }
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hours summary */}
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-400">Horas consumidas</span>
              <span className="font-semibold tabular-nums text-ink dark:text-white">
                {hoursPercent}%
              </span>
            </div>
            <ProgressBar value={hoursPercent} className="mt-2" tone={hoursPercent > 100 ? "danger" : hoursPercent > 80 ? "warning" : "success"} />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {formatHours(actualHours)} de {formatHours(plannedHours)} planejadas
            </p>
          </div>
        </div>
      </section>

      {/* Resources alert */}
      {overAllocated.length > 0 && (
        <section className="mt-4" aria-label="Alertas de recursos">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
            <TrendingUp size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {overAllocated.length} recurso{overAllocated.length > 1 ? "s" : ""} sobrealcado{overAllocated.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {overAllocated.map((u) => u.name).join(", ")} — revise as alocações.
              </p>
            </div>
            <Link href="/resources" className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100">
              Ver recursos →
            </Link>
          </div>
        </section>
      )}
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
