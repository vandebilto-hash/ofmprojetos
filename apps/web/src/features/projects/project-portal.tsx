import Link from "next/link";
import { formatDate, formatHours } from "@/lib/format";

type ProjectPortalProps = {
  project: any;
  publicToken?: string;
};

const riskLabel: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  CRITICAL: "Critico"
};

const statusLabel: Record<string, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
  DELAYED: "Atrasado",
  OPEN: "Aberto",
  IN_TREATMENT: "Em tratamento",
  CLOSED: "Encerrado",
  DONE: "Concluido"
};

function kpi(label: string, value: string | number, detail?: string) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

function empty(label: string) {
  return <p className="rounded-md border border-dashed border-line p-4 text-sm text-slate-500">{label}</p>;
}

export function ProjectPortal({ project, publicToken }: ProjectPortalProps) {
  const completedTasks = project.tasks.filter((task: any) => task.status === "DONE").length;
  const delayedTasks = project.tasks.filter((task: any) => new Date(task.plannedEnd) < new Date() && task.status !== "DONE").length;
  const criticalRisks = project.risks.filter((risk: any) => risk.classification === "CRITICAL" || risk.classification === "HIGH").length;
  const openBlockers = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED").length;
  const downloadBase = publicToken ? `/p/${publicToken}` : `/projects/${project.id}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Home</p>
          <h2 className="mt-2 text-3xl font-bold text-ink">{project.home?.mission ?? project.description ?? "Missao do projeto nao cadastrada."}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-ink">Sobre o cliente</h3>
              <p className="mt-1 text-sm text-slate-600">{project.home?.clientOverview ?? project.client.name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Proposta e escopo</h3>
              <p className="mt-1 text-sm text-slate-600">{project.home?.proposal ?? "Proposta pendente de cadastro."}</p>
              <p className="mt-2 text-sm text-slate-600">{project.home?.scope ?? "Escopo pendente de cadastro."}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
          <h3 className="font-semibold text-ink">Nossos parceiros</h3>
          <div className="mt-3 grid gap-3">
            {project.partners.map((partner: any) => (
              <div key={partner.id} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  {partner.logoUrl ? <img src={partner.logoUrl} alt={partner.name} className="h-8 w-8 rounded object-contain" /> : null}
                  <p className="font-semibold text-ink">{partner.name}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${partner.type === "CLIENT" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                    {partner.type === "CLIENT" ? "Cliente" : "Parceiro Técnico"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{partner.description ?? "Parceiro do projeto"}</p>
              </div>
            ))}
            {!project.partners.length ? empty("Nenhum parceiro cadastrado.") : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {kpi("Avanco", `${Number(project.progressPercent)}%`, "planejado x real")}
        {kpi("Atividades", project.tasks.length, `${completedTasks} concluidas | ${delayedTasks} atrasadas`)}
        {kpi("Riscos altos", criticalRisks, `${project.risks.length} riscos cadastrados`)}
        {kpi("Bloqueios", openBlockers, "bloqueios em aberto")}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Governanca</h2>
          <div className="mt-4 grid gap-3">
            {project.stakeholders.map((stakeholder: any) => (
              <div key={stakeholder.id} className="flex items-center justify-between rounded-lg border border-line p-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{stakeholder.name}</p>
                  <p className="text-slate-500">{stakeholder.company ?? project.client.name} | {stakeholder.projectRole ?? stakeholder.jobTitle ?? "Stakeholder"}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {stakeholder.influence}/{stakeholder.interest}
                </span>
              </div>
            ))}
            {!project.stakeholders.length ? empty("Nenhum stakeholder cadastrado.") : null}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Planos e documentos</h2>
          <div className="mt-4 grid gap-3">
            {project.documents.map((document: any) => (
              <div key={document.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{document.name}</p>
                    <p className="text-slate-500">{document.type} | {document.status} | {document.version ?? "sem versao"}</p>
                  </div>
                  {document.downloadUrl || document.externalUrl ? (
                    <Link href={document.downloadUrl ?? document.externalUrl} target="_blank" className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Baixar
                    </Link>
                  ) : null}
                </div>
                {document.embedUrl ? <Link href={document.embedUrl} target="_blank" className="mt-2 inline-block text-xs font-semibold text-brand-700">Visualizar no Google Drive</Link> : null}
              </div>
            ))}
            {!project.documents.length ? empty("Nenhum plano cadastrado.") : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Marcos do projeto</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {project.milestones.map((milestone: any) => (
            <div key={milestone.id} className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{formatDate(milestone.plannedDate)}</p>
              <h3 className="mt-2 font-bold text-ink">{milestone.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{milestone.description ?? milestone.type ?? "Marco do projeto"}</p>
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel[milestone.status] ?? milestone.status}</span>
            </div>
          ))}
          {!project.milestones.length ? empty("Nenhum marco cadastrado.") : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Planejamento</h2>
            {!publicToken ? <Link href={`${downloadBase}/gantt`} className="text-sm font-semibold text-brand-700">Abrir cronograma</Link> : null}
          </div>
          <div className="mt-4 grid gap-3">
            {project.tasks.slice(0, 6).map((task: any) => (
              <div key={task.id} className="grid gap-3 rounded-lg border border-line p-3 text-sm md:grid-cols-[1fr_120px_120px_120px]">
                <div>
                  <p className="font-semibold text-ink">{task.wbsCode ? `${task.wbsCode} - ` : ""}{task.name}</p>
                  <p className="text-slate-500">Responsavel: {task.owner?.name ?? "Nao definido"}</p>
                </div>
                <span>{formatDate(task.plannedEnd)}</span>
                <span>{Number(task.progressPercent)}%</span>
                <span>{formatHours(task.actualHours)} / {formatHours(task.estimatedHours)}</span>
              </div>
            ))}
            {!project.tasks.length ? empty("Nenhuma atividade importada ou cadastrada.") : null}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">To-do</h2>
          <div className="mt-4 grid gap-3">
            {project.todos.map((todo: any) => (
              <div key={todo.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{todo.code ? `${todo.code} - ` : ""}{todo.description}</p>
                  <span className={`h-3 w-3 rounded-full ${todo.trafficLight === "RED" ? "bg-red-500" : todo.trafficLight === "YELLOW" ? "bg-amber-400" : "bg-emerald-500"}`} />
                </div>
                <p className="mt-1 text-slate-500">{todo.responsible ?? "Sem responsavel"} | {todo.priority} | limite {formatDate(todo.dueDate)}</p>
                <p className="mt-2 text-slate-600">Proxima acao: {todo.nextAction ?? "nao informada"}</p>
              </div>
            ))}
            {!project.todos.length ? empty("Nenhum to-do cadastrado.") : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Matriz de riscos</h2>
          <div className="mt-4 grid gap-3">
            {project.risks.map((risk: any) => (
              <div key={risk.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{risk.name}</p>
                    <p className="text-slate-600">{risk.description ?? risk.event ?? "Risco do projeto"}</p>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{riskLabel[risk.classification] ?? risk.classification}</span>
                </div>
                <p className="mt-2 text-slate-500">Estrategia: {risk.responseStrategy} | Revisao: {formatDate(risk.lastReviewAt)}</p>
              </div>
            ))}
            {!project.risks.length ? empty("Nenhum risco cadastrado.") : null}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Bloqueios</h2>
          <div className="mt-4 grid gap-3">
            {project.blockers.map((blocker: any) => (
              <div key={blocker.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{blocker.title}</p>
                    <p className="text-slate-600">{blocker.description ?? "Bloqueio do projeto"}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{blocker.status}</span>
                </div>
                <p className="mt-2 text-slate-500">Data alvo: {formatDate(blocker.expectedResolutionAt)} | Impacto: {blocker.scheduleImpactDays} dias</p>
              </div>
            ))}
            {!project.blockers.length ? empty("Nenhum bloqueio cadastrado.") : null}
          </div>
        </div>
      </section>
    </div>
  );
}
