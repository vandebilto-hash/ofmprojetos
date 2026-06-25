import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { deleteProjectActionAction } from "@/server/actions/projects";
import { ActionForm } from "./action-form";

const statusLabel: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

const priorityLabel: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export default async function ProjectActionsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      todos: {
        include: { task: true, risk: true, blocker: true, pendingIssue: true },
        orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
      },
      tasks: { orderBy: [{ wbsCode: "asc" }, { name: "asc" }] },
      risks: { orderBy: [{ classification: "desc" }, { name: "asc" }] },
      blockers: { orderBy: { openedAt: "desc" } },
      pendingIssues: { orderBy: [{ priority: "desc" }, { dueDate: "asc" }] },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } },
    },
  });
  if (!project) notFound();

  const now = new Date();
  const actions = project.todos;
  const openActions = actions.filter((action) => action.status !== "DONE" && action.status !== "CANCELED");
  const overdueActions = openActions.filter((action) => action.dueDate && action.dueDate < now);
  const highActions = openActions.filter((action) => action.priority === "HIGH" || action.priority === "CRITICAL");
  const doneActions = actions.filter((action) => action.status === "DONE");
  const people = getProjectPeople(project);

  return (
    <>
      <PageHeader title={`Ações | ${project.name}`} description="Ações operacionais vinculadas a riscos, pendências, bloqueios ou tarefas." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric label="Abertas" value={openActions.length} tone={openActions.length ? "amber" : "green"} />
        <Metric label="Vencidas" value={overdueActions.length} tone={overdueActions.length ? "red" : "green"} />
        <Metric label="Críticas/altas" value={highActions.length} tone={highActions.length ? "red" : "slate"} />
        <Metric label="Concluídas" value={doneActions.length} tone="green" />
      </section>

      <div className="mb-4 flex justify-end">
        <DialogAction title="Nova ação" description="Cadastre uma ação avulsa ou vinculada a risco, pendência, bloqueio ou tarefa." trigger="create" triggerLabel="Nova ação">
          <ActionForm project={project} people={people} />
        </DialogAction>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink">Painel de ações</h2>
          <p className="mt-1 text-sm text-slate-600">Acompanhe responsáveis, prazos, visibilidade ao cliente e vínculos operacionais.</p>
        </div>
        <div className="grid gap-3">
          {actions.map((action) => (
            <article key={action.id} className="rounded-lg border border-line p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{action.code ? `${action.code} - ` : ""}{action.description}</h3>
                    <span className={`h-3 w-3 rounded-full ${action.trafficLight === "RED" ? "bg-red-500" : action.trafficLight === "YELLOW" ? "bg-amber-400" : "bg-emerald-500"}`} />
                    {action.visibleToClient ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Cliente</span> : null}
                  </div>
                  <p className="mt-1 text-slate-500">
                    {action.responsible ?? "Sem responsável"} | {priorityLabel[action.priority] ?? action.priority} | {statusLabel[action.status] ?? action.status} | prazo {formatDate(action.dueDate)}
                  </p>
                  <p className="mt-2 text-slate-600">Próxima ação: {action.nextAction ?? "não informada"}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Vínculo: {action.pendingIssue?.title ?? action.risk?.name ?? action.blocker?.title ?? action.task?.name ?? action.origin}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Progresso {Number(action.actualProgress)}% / planejado {Number(action.plannedProgress)}% · {formatHours(action.workedHours)} de {formatHours(action.estimatedHours)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <DialogAction title="Editar ação" description={action.description} trigger="edit">
                    <ActionForm project={project} people={people} action={action} />
                  </DialogAction>
                  <DialogAction title="Excluir ação" description={`Deseja excluir "${action.description}"?`} trigger="delete">
                    <form action={deleteProjectActionAction} className="flex justify-end">
                      <input type="hidden" name="actionId" value={action.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            </article>
          ))}
          {!actions.length ? <div className="rounded-lg border border-dashed border-line bg-slate-50 p-6 text-sm text-slate-500">Nenhuma ação cadastrada.</div> : null}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "slate" | "green" | "amber" | "red" }) {
  const toneClass = {
    slate: "text-slate-700",
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
  }[tone];
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
