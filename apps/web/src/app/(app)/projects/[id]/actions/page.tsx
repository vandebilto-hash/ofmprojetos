import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { deleteProjectActionAction, upsertProjectActionAction } from "@/server/actions/projects";

function inputDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

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

function ActionForm({ project, people, action }: { project: any; people: string[]; action?: any }) {
  const isEdit = Boolean(action);
  const inputClass = "h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const selectClass = "h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
  const textareaClass = "min-h-[80px] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300";
  const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  return (
    <form action={upsertProjectActionAction} className="grid gap-4">
      {isEdit ? <input type="hidden" name="actionId" value={action.id} /> : null}
      <input type="hidden" name="projectId" value={project.id} />

      <div>
        <p className={sectionTitle}>Identificação</p>
        <div className="mt-2 grid gap-3 md:grid-cols-[160px_1fr]">
          <label className={labelClass}>
            Código
            <input name="code" defaultValue={action?.code ?? ""} placeholder="AC-001" className={inputClass} />
          </label>
          <label className={labelClass}>
            Descrição <span className="text-red-500">*</span>
            <input name="description" required defaultValue={action?.description ?? ""} className={inputClass} placeholder="Descrição da ação" />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Responsável e prazo</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <PeopleMultiSelect name="responsible" label="Responsável" people={people} defaultValue={action?.responsible ?? ""} />
          <label className={labelClass}>
            Prazo
            <input name="dueDate" type="date" defaultValue={inputDate(action?.dueDate)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Origem
            <select name="origin" defaultValue={action?.origin ?? "Manual"} className={selectClass}>
              <option value="Manual">Manual</option>
              <option value="Risco">Risco</option>
              <option value="Pendência">Pendência</option>
              <option value="Bloqueio">Bloqueio</option>
              <option value="Tarefa">Tarefa</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Status e classificação</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            Status
            <select name="status" defaultValue={action?.status ?? "OPEN"} className={selectClass}>
              <option value="OPEN">Aberta</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </label>
          <label className={labelClass}>
            Prioridade
            <select name="priority" defaultValue={action?.priority ?? "MEDIUM"} className={selectClass}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </label>
          <label className={labelClass}>
            Semáforo
            <select name="trafficLight" defaultValue={action?.trafficLight ?? "GREEN"} className={selectClass}>
              <option value="GREEN">Verde</option>
              <option value="YELLOW">Amarelo</option>
              <option value="RED">Vermelho</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input name="visibleToClient" type="checkbox" defaultChecked={action?.visibleToClient ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Visível ao cliente
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Vínculos</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            Risco relacionado
            <select name="riskId" defaultValue={action?.riskId ?? ""} className={selectClass}>
              <option value="">Sem risco</option>
              {project.risks.map((risk: any) => <option key={risk.id} value={risk.id}>{risk.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Pendência relacionada
            <select name="pendingIssueId" defaultValue={action?.pendingIssueId ?? ""} className={selectClass}>
              <option value="">Sem pendência</option>
              {project.pendingIssues.map((pending: any) => <option key={pending.id} value={pending.id}>{pending.title}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Bloqueio relacionado
            <select name="blockerId" defaultValue={action?.blockerId ?? ""} className={selectClass}>
              <option value="">Sem bloqueio</option>
              {project.blockers.map((blocker: any) => <option key={blocker.id} value={blocker.id}>{blocker.title}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Tarefa relacionada
            <select name="taskId" defaultValue={action?.taskId ?? ""} className={selectClass}>
              <option value="">Sem tarefa</option>
              {project.tasks.map((task: any) => <option key={task.id} value={task.id}>{task.wbsCode ? `${task.wbsCode} - ` : ""}{task.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Progresso e horas</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            Progresso planejado (%)
            <input name="plannedProgress" type="number" min="0" max="100" defaultValue={Number(action?.plannedProgress ?? 0)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Progresso realizado (%)
            <input name="actualProgress" type="number" min="0" max="100" defaultValue={Number(action?.actualProgress ?? 0)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Horas estimadas
            <input name="estimatedHours" type="number" min="0" step="0.5" defaultValue={Number(action?.estimatedHours ?? 0)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Horas realizadas
            <input name="workedHours" type="number" min="0" step="0.5" defaultValue={Number(action?.workedHours ?? 0)} className={inputClass} />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Próxima ação</p>
        <label className={`${labelClass} mt-2`}>
          <textarea name="nextAction" rows={2} defaultValue={action?.nextAction ?? ""} className={textareaClass} placeholder="Próxima ação a ser tomada" />
        </label>
      </div>

      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          {isEdit ? "Salvar ação" : "Cadastrar ação"}
        </button>
      </div>
    </form>
  );
}
