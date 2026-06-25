import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PeopleSelect } from "@/components/ui/people-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { createRiskAction, deleteBlockerAction, deletePendingIssueAction, deleteRiskAction, updateRiskAction, upsertBlockerAction, upsertPendingIssueAction } from "@/server/actions/projects";

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

const blockerCriticalityLabel: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

const blockerCriticalityClass: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700"
};

function BlockerCriticalityBadge({ value }: { value: string }) {
  return (
    <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${blockerCriticalityClass[value] ?? blockerCriticalityClass.MEDIUM}`}>
      Criticidade {blockerCriticalityLabel[value] ?? blockerCriticalityLabel.MEDIUM}
    </span>
  );
}

const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function PendingIssueForm({ project, people, pending }: { project: any; people: string[]; pending?: any }) {
  return (
    <form action={upsertPendingIssueAction} className="grid gap-4">
      {pending ? <input type="hidden" name="pendingIssueId" value={pending.id} /> : null}
      <input type="hidden" name="projectId" value={project.id} />

      <div>
        <p className={sectionTitle}>Identificação</p>
        <div className="mt-2 grid gap-3">
          <label className={labelClass}>
            Título <span className="text-red-500">*</span>
            <input name="title" required defaultValue={pending?.title ?? ""} className={inputClass} placeholder="Título da pendência" />
          </label>
          <label className={labelClass}>
            Descrição <span className="text-red-500">*</span>
            <textarea name="description" rows={3} defaultValue={pending?.description ?? ""} className={textareaClass} placeholder="Descreva a pendência" required />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Vínculos e responsável</p>
        <div className="mt-2 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Risco relacionado
              <select name="riskId" defaultValue={pending?.riskId ?? ""} className={selectClass}>
                <option value="">Sem risco</option>
                {project.risks.map((risk: any) => <option key={risk.id} value={risk.id}>{risk.name}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Empresa responsável <span className="text-red-500">*</span>
              <select name="responsibleCompany" defaultValue={pending?.responsibleCompany ?? ""} className={selectClass} required>
                <option value="">Selecione</option>
                <option value="OFM">OFM</option>
                <option value={project.client?.name}>{project.client?.name}</option>
              </select>
            </label>
          </div>
          <PeopleSelect name="responsiblePerson" label="Pessoa responsável" people={people} defaultValue={pending?.responsiblePerson ?? ""} required />
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Datas e status</p>
        <div className="mt-2 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Data de abertura <span className="text-red-500">*</span>
              <input name="openedAt" type="date" defaultValue={inputDate(pending?.openedAt ?? new Date())} className={inputClass} required />
            </label>
            <label className={labelClass}>
              Prazo <span className="text-red-500">*</span>
              <input name="dueDate" type="date" defaultValue={inputDate(pending?.dueDate)} className={inputClass} required />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={labelClass}>
              Status <span className="text-red-500">*</span>
              <select name="status" defaultValue={pending?.status ?? "OPEN"} className={selectClass} required>
                <option value="OPEN">Aberta</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="RESOLVED">Resolvida</option>
                <option value="CANCELED">Cancelada</option>
              </select>
            </label>
            <label className={labelClass}>
              Prioridade <span className="text-red-500">*</span>
              <select name="priority" defaultValue={pending?.priority ?? "MEDIUM"} className={selectClass} required>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </label>
            <label className={labelClass}>
              Resolvida em
              <input name="resolvedAt" type="date" defaultValue={inputDate(pending?.resolvedAt)} className={inputClass} />
            </label>
          </div>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Acompanhamento</p>
        <div className="mt-2 grid gap-3">
          <label className={labelClass}>
            Impacto / observação <span className="text-red-500">*</span>
            <textarea name="impactDescription" rows={2} defaultValue={pending?.impactDescription ?? ""} className={textareaClass} placeholder="Descreva o impacto" required />
          </label>
          <label className={labelClass}>
            Próxima ação <span className="text-red-500">*</span>
            <textarea name="nextAction" rows={2} defaultValue={pending?.nextAction ?? ""} className={textareaClass} placeholder="Próxima ação a ser tomada" required />
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          {pending ? "Salvar pendência" : "Cadastrar pendência"}
        </button>
      </div>
    </form>
  );
}

export default async function ProjectBlockersPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      blockers: { include: { task: true }, orderBy: { createdAt: "desc" } },
      pendingIssues: { include: { risk: true }, orderBy: [{ priority: "desc" }, { dueDate: "asc" }] },
      risks: { orderBy: [{ classification: "desc" }, { registeredAt: "desc" }] },
      tasks: { orderBy: { name: "asc" } },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } }
    }
  });
  if (!project) notFound();
  const people = getProjectPeople(project);
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title={`Riscos e pendencias | ${project.name}`} description="Matriz de riscos, bloqueios, impactos e proximas acoes." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <section className="mb-5 grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Riscos</p><p className="mt-2 text-2xl font-bold">{project.risks.length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Criticos/altos</p><p className="mt-2 text-2xl font-bold">{project.risks.filter((risk) => risk.classification === "CRITICAL" || risk.classification === "HIGH").length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Pendências</p><p className="mt-2 text-2xl font-bold">{project.pendingIssues.filter((pending) => pending.status !== "RESOLVED" && pending.status !== "CANCELED").length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Bloqueios</p><p className="mt-2 text-2xl font-bold">{project.blockers.length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Abertos</p><p className="mt-2 text-2xl font-bold">{project.blockers.filter((blocker) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED").length}</p></div>
      </section>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <DialogAction title="Cadastrar risco" description="Inclua um novo risco na matriz do projeto." trigger="create" triggerLabel="Novo risco">
          <form action={createRiskAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={project.id} />

            <div>
              <p className={sectionTitle}>Identificação</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Nome do risco <span className="text-red-500">*</span>
                  <input name="name" required className={inputClass} placeholder="Nome do risco" />
                </label>
                <label className={labelClass}>
                  Classificação <span className="text-red-500">*</span>
                  <select name="classification" defaultValue="MEDIUM" className={selectClass} required>
                    <option value="LOW">Baixo</option>
                    <option value="MEDIUM">Médio</option>
                    <option value="HIGH">Alto</option>
                    <option value="CRITICAL">Crítico</option>
                  </select>
                </label>
              </div>
              <label className={labelClass}>
                Descrição <span className="text-red-500">*</span>
                <textarea name="description" rows={3} className={textareaClass} placeholder="Descreva o risco" required />
              </label>
            </div>

            <div>
              <p className={sectionTitle}>Análise</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <label className={labelClass}>
                  Probabilidade <span className="text-red-500">*</span>
                  <select name="probability" defaultValue="MEDIUM" className={selectClass} required>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Estratégia <span className="text-red-500">*</span>
                  <select name="responseStrategy" defaultValue="MITIGATE" className={selectClass} required>
                    <option value="MITIGATE">Mitigar</option>
                    <option value="ACCEPT">Aceitar</option>
                    <option value="TRANSFER">Transferir</option>
                    <option value="AVOID">Evitar</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Status <span className="text-red-500">*</span>
                  <select name="status" defaultValue="OPEN" className={selectClass} required>
                    <option value="OPEN">Aberto</option>
                    <option value="IN_TREATMENT">Em tratamento</option>
                    <option value="MATERIALIZED">Materializado</option>
                    <option value="CLOSED">Encerrado</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Causa <span className="text-red-500">*</span>
                  <input name="cause" className={inputClass} placeholder="Causa do risco" required />
                </label>
                <label className={labelClass}>
                  Evento <span className="text-red-500">*</span>
                  <input name="event" className={inputClass} placeholder="Evento que pode ocorrer" required />
                </label>
              </div>
            </div>

            <div>
              <p className={sectionTitle}>Impacto e resposta</p>
              <div className="mt-2 grid gap-3">
                <label className={labelClass}>
                  Impacto <span className="text-red-500">*</span>
                  <textarea name="impact" rows={2} className={textareaClass} placeholder="Descreva o impacto" required />
                </label>
                <label className={labelClass}>
                  Ações preventivas <span className="text-red-500">*</span>
                  <textarea name="preventiveActions" rows={2} className={textareaClass} placeholder="Ações para mitigar o risco" required />
                </label>
                <label className={labelClass}>
                  Plano de contingência <span className="text-red-500">*</span>
                  <textarea name="contingencyPlan" rows={2} className={textareaClass} placeholder="Plano caso o risco se materialize" required />
                </label>
              </div>
            </div>

            <div>
              <p className={sectionTitle}>Responsável e acompanhamento</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <label className={labelClass}>
                  Gatilhos <span className="text-red-500">*</span>
                  <input name="triggers" className={inputClass} placeholder="Sinais de alerta" required />
                </label>
                <PeopleSelect name="owner" label="Responsável" people={people} required />
                <label className={labelClass}>
                  Última revisão <span className="text-red-500">*</span>
                  <input name="lastReviewAt" type="date" className={inputClass} required />
                </label>
              </div>
              <label className={labelClass}>
                Observações
                <textarea name="notes" rows={2} className={textareaClass} placeholder="Notas adicionais" />
              </label>
            </div>

            <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                Cadastrar risco
              </button>
            </div>
          </form>
        </DialogAction>
        <DialogAction title="Cadastrar bloqueio" description="Registre um impedimento do projeto ou de uma tarefa." trigger="create" triggerLabel="Novo bloqueio">
          <form action={upsertBlockerAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={project.id} />

            <div>
              <p className={sectionTitle}>Identificação</p>
              <div className="mt-2 grid gap-3">
                <label className={labelClass}>
                  Título <span className="text-red-500">*</span>
                  <input name="title" required placeholder="Título do bloqueio" className={inputClass} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>
                    Data de abertura <span className="text-red-500">*</span>
                    <input name="openedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} required />
                  </label>
                  <label className={labelClass}>
                    Previsão de resolução <span className="text-red-500">*</span>
                    <input name="expectedResolutionAt" type="date" className={inputClass} required />
                  </label>
                </div>
                <label className={labelClass}>
                  Descrição <span className="text-red-500">*</span>
                  <textarea name="description" rows={3} placeholder="Descrição do bloqueio" className={textareaClass} required />
                </label>
              </div>
            </div>

            <div>
              <p className={sectionTitle}>Vínculos e responsável</p>
              <div className="mt-2 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>
                    Tarefa relacionada <span className="text-red-500">*</span>
                    <select name="taskId" className={selectClass} required>
                      <option value="">Selecione a tarefa</option>
                      {project.tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Empresa responsável <span className="text-red-500">*</span>
                    <select name="responsibleCompany" className={selectClass} required>
                      <option value="">Selecione</option>
                      <option value="OFM">OFM</option>
                      <option value={project.client?.name}>{project.client?.name}</option>
                    </select>
                  </label>
                </div>
                <PeopleSelect name="responsiblePerson" label="Pessoa responsável" people={people} required />
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>
                    Status <span className="text-red-500">*</span>
                    <select name="status" defaultValue="OPEN" className={selectClass} required>
                      <option value="OPEN">Aberto</option>
                      <option value="IN_PROGRESS">Em andamento</option>
                      <option value="RESOLVED">Resolvido</option>
                      <option value="CANCELED">Cancelado</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Criticidade <span className="text-red-500">*</span>
                    <select name="criticality" defaultValue="MEDIUM" className={selectClass} required>
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                  </label>
                </div>
                <label className={labelClass}>
                  Responsável pela resolução <span className="text-red-500">*</span>
                  <select name="resolverId" className={selectClass} required>
                    <option value="">Selecione</option>
                    {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <p className={sectionTitle}>Impacto</p>
              <div className="mt-2 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>
                    Impacto no cronograma (dias) <span className="text-red-500">*</span>
                    <input name="scheduleImpactDays" type="number" defaultValue="0" placeholder="Dias de atraso" className={inputClass} required />
                  </label>
                  <label className={labelClass}>
                    Impacto financeiro (R$) <span className="text-red-500">*</span>
                    <CurrencyInput name="financialImpact" type="text" defaultValue="0" placeholder="R$ 0,00" className={inputClass} required />
                  </label>
                </div>
                <label className={labelClass}>
                  Impacto no projeto <span className="text-red-500">*</span>
                  <textarea name="impactDescription" rows={2} className={textareaClass} placeholder="Descreva o impacto" required />
                </label>
                <label className={labelClass}>
                  Próxima ação <span className="text-red-500">*</span>
                  <textarea name="nextAction" rows={2} className={textareaClass} placeholder="Próxima ação a ser tomada" required />
                </label>
              </div>
            </div>

            <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                Cadastrar bloqueio
              </button>
            </div>
          </form>
        </DialogAction>
        <DialogAction title="Cadastrar pendência" description="Registre um ponto de atenção que não bloqueia o projeto." trigger="create" triggerLabel="Nova pendência">
          <PendingIssueForm project={project} people={people} />
        </DialogAction>
      </div>
      <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Matriz de riscos</h2>
        <div className="mt-4 grid gap-3">
          {project.risks.map((risk) => (
            <article key={risk.id} className="rounded-lg border border-line p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">{risk.name}</h3>
                  <p className="mt-1 text-slate-600">{risk.description}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{risk.classification}</span>
                  <DialogAction title="Editar risco" description={risk.name} trigger="edit">
                    <form action={updateRiskAction} className="grid gap-4">
                      <input type="hidden" name="riskId" value={risk.id} />
                      <input type="hidden" name="projectId" value={project.id} />

                      <div>
                        <p className={sectionTitle}>Identificação</p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Nome do risco <span className="text-red-500">*</span>
                            <input name="name" required defaultValue={risk.name} className={inputClass} />
                          </label>
                          <label className={labelClass}>
                            Classificação
                            <select name="classification" defaultValue={risk.classification} className={selectClass}>
                              <option value="LOW">Baixo</option>
                              <option value="MEDIUM">Médio</option>
                              <option value="HIGH">Alto</option>
                              <option value="CRITICAL">Crítico</option>
                            </select>
                          </label>
                        </div>
                        <label className={`${labelClass} mt-3`}>
                          Descrição
                          <textarea name="description" defaultValue={risk.description ?? ""} rows={3} className={textareaClass} />
                        </label>
                      </div>

                      <div>
                        <p className={sectionTitle}>Análise</p>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <label className={labelClass}>
                            Probabilidade
                            <select name="probability" defaultValue={risk.probability} className={selectClass}>
                              <option value="LOW">Baixa</option>
                              <option value="MEDIUM">Média</option>
                              <option value="HIGH">Alta</option>
                            </select>
                          </label>
                          <label className={labelClass}>
                            Estratégia
                            <select name="responseStrategy" defaultValue={risk.responseStrategy} className={selectClass}>
                              <option value="MITIGATE">Mitigar</option>
                              <option value="ACCEPT">Aceitar</option>
                              <option value="TRANSFER">Transferir</option>
                              <option value="AVOID">Evitar</option>
                            </select>
                          </label>
                          <label className={labelClass}>
                            Status
                            <select name="status" defaultValue={risk.status} className={selectClass}>
                              <option value="OPEN">Aberto</option>
                              <option value="IN_TREATMENT">Em tratamento</option>
                              <option value="MATERIALIZED">Materializado</option>
                              <option value="CLOSED">Encerrado</option>
                            </select>
                          </label>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Causa
                            <input name="cause" defaultValue={risk.cause ?? ""} className={inputClass} />
                          </label>
                          <label className={labelClass}>
                            Evento
                            <input name="event" defaultValue={risk.event ?? ""} className={inputClass} />
                          </label>
                        </div>
                      </div>

                      <div>
                        <p className={sectionTitle}>Impacto e resposta</p>
                        <div className="mt-2 grid gap-3">
                          <label className={labelClass}>
                            Impacto
                            <textarea name="impact" defaultValue={risk.impact ?? ""} rows={2} className={textareaClass} />
                          </label>
                          <label className={labelClass}>
                            Ações preventivas
                            <textarea name="preventiveActions" defaultValue={risk.preventiveActions ?? ""} rows={2} className={textareaClass} />
                          </label>
                          <label className={labelClass}>
                            Plano de contingência
                            <textarea name="contingencyPlan" defaultValue={risk.contingencyPlan ?? ""} rows={2} className={textareaClass} />
                          </label>
                        </div>
                      </div>

                      <div>
                        <p className={sectionTitle}>Responsável e acompanhamento</p>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <label className={labelClass}>
                            Gatilhos
                            <input name="triggers" defaultValue={risk.triggers ?? ""} className={inputClass} />
                          </label>
                          <PeopleMultiSelect name="owner" label="Responsável" people={people} defaultValue={risk.owner ?? ""} />
                          <label className={labelClass}>
                            Última revisão
                            <input name="lastReviewAt" type="date" defaultValue={inputDate(risk.lastReviewAt)} className={inputClass} />
                          </label>
                        </div>
                        <label className={`${labelClass} mt-3`}>
                          Observações
                          <textarea name="notes" defaultValue={risk.notes ?? ""} rows={2} className={textareaClass} />
                        </label>
                      </div>

                      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Salvar</button>
                      </div>
                    </form>
                  </DialogAction>
                  <DialogAction title="Excluir risco" description={`Deseja realmente excluir "${risk.name}"?`} trigger="delete">
                    <form action={deleteRiskAction} className="flex justify-end">
                      <input type="hidden" name="riskId" value={risk.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
              <p className="mt-3 text-slate-500">Probabilidade: {risk.probability} | Estrategia: {risk.responseStrategy} | Responsavel: {risk.owner ?? "-"}</p>
              <p className="mt-2 text-slate-500">Gatilhos: {risk.triggers ?? "-"} | Ultima revisao: {formatDate(risk.lastReviewAt)}</p>
            </article>
          ))}
          {!project.risks.length ? <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhum risco cadastrado.</div> : null}
        </div>
      </section>
      <section className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Pendências</h2>
        <p className="mt-1 text-sm text-slate-600">Itens que precisam acompanhamento, mas não impedem a continuidade do projeto.</p>
        <div className="mt-4 grid gap-3">
          {project.pendingIssues.map((pending) => (
            <article key={pending.id} className="rounded-lg border border-line p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">{pending.title}</h3>
                  <p className="mt-1 text-slate-600">{pending.description ?? pending.impactDescription ?? "Sem descrição."}</p>
                  <p className="mt-2 text-xs text-slate-500">Risco: {pending.risk?.name ?? "Sem vínculo"} | Responsável: {pending.responsiblePerson ?? "-"} | prazo {formatDate(pending.dueDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">Próxima ação: {pending.nextAction ?? "-"}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{pending.status}</span>
                  <BlockerCriticalityBadge value={pending.priority} />
                  <DialogAction title="Editar pendência" description={pending.title} trigger="edit">
                    <PendingIssueForm project={project} people={people} pending={pending} />
                  </DialogAction>
                  <DialogAction title="Excluir pendência" description={`Deseja realmente excluir "${pending.title}"?`} trigger="delete">
                    <form action={deletePendingIssueAction} className="flex justify-end">
                      <input type="hidden" name="pendingIssueId" value={pending.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            </article>
          ))}
          {!project.pendingIssues.length ? <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhuma pendência cadastrada.</div> : null}
        </div>
      </section>
      <div className="grid gap-3">
        {project.blockers.map((blocker) => (
          <article key={blocker.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-bold">{blocker.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{blocker.task?.name ?? "Projeto geral"}</p>
              </div>
              <div className="flex items-start gap-2">
                <BlockerCriticalityBadge value={blocker.criticality} />
                <StatusBadge status={blocker.status} />
                <DialogAction title="Editar bloqueio" description={blocker.title} trigger="edit">
                  <form action={upsertBlockerAction} className="grid gap-4">
                    <input type="hidden" name="blockerId" value={blocker.id} />
                    <input type="hidden" name="projectId" value={project.id} />

                    <div>
                      <p className={sectionTitle}>Identificação</p>
                      <div className="mt-2 grid gap-3">
                        <label className={labelClass}>
                          Título
                          <input name="title" defaultValue={blocker.title} className={inputClass} />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Data de abertura
                            <input name="openedAt" type="date" defaultValue={inputDate(blocker.openedAt)} className={inputClass} />
                          </label>
                          <label className={labelClass}>
                            Previsão de resolução
                            <input name="expectedResolutionAt" type="date" defaultValue={inputDate(blocker.expectedResolutionAt)} className={inputClass} />
                          </label>
                        </div>
                        <label className={labelClass}>
                          Descrição
                          <textarea name="description" defaultValue={blocker.description ?? ""} rows={3} className={textareaClass} />
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className={sectionTitle}>Vínculos e responsável</p>
                      <div className="mt-2 grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Tarefa relacionada
                            <select name="taskId" defaultValue={blocker.taskId ?? ""} className={selectClass}>
                              <option value="">Projeto geral</option>
                              {project.tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                            </select>
                          </label>
                          <label className={labelClass}>
                            Empresa responsável
                            <input name="responsibleCompany" defaultValue={blocker.responsibleCompany ?? ""} className={inputClass} />
                          </label>
                        </div>
                        <PeopleMultiSelect name="responsiblePerson" label="Pessoa responsável" people={people} defaultValue={blocker.responsiblePerson ?? ""} />
                        <div className="grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Status
                            <select name="status" defaultValue={blocker.status} className={selectClass}>
                              <option value="OPEN">Aberto</option>
                              <option value="IN_PROGRESS">Em andamento</option>
                              <option value="RESOLVED">Resolvido</option>
                              <option value="CANCELED">Cancelado</option>
                            </select>
                          </label>
                          <label className={labelClass}>
                            Criticidade
                            <select name="criticality" defaultValue={blocker.criticality} className={selectClass}>
                              <option value="LOW">Baixa</option>
                              <option value="MEDIUM">Média</option>
                              <option value="HIGH">Alta</option>
                              <option value="CRITICAL">Crítica</option>
                            </select>
                          </label>
                        </div>
                        <label className={labelClass}>
                          Responsável pela resolução
                          <select name="resolverId" defaultValue={blocker.resolverId ?? ""} className={selectClass}>
                            <option value="">Selecione</option>
                            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className={sectionTitle}>Impacto</p>
                      <div className="mt-2 grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <label className={labelClass}>
                            Impacto no cronograma (dias)
                            <input name="scheduleImpactDays" type="number" defaultValue={blocker.scheduleImpactDays} className={inputClass} />
                          </label>
                          <label className={labelClass}>
                            Impacto financeiro
                            <input name="financialImpact" type="number" step="0.01" defaultValue={Number(blocker.financialImpact)} className={inputClass} />
                          </label>
                        </div>
                        <label className={labelClass}>
                          Impacto no projeto
                          <textarea name="impactDescription" defaultValue={blocker.impactDescription ?? ""} rows={2} className={textareaClass} />
                        </label>
                        <label className={labelClass}>
                          Próxima ação
                          <textarea name="nextAction" defaultValue={blocker.nextAction ?? ""} rows={2} className={textareaClass} />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                      <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Salvar bloqueio</button>
                    </div>
                  </form>
                </DialogAction>
                <DialogAction title="Excluir bloqueio" description={`Deseja realmente excluir "${blocker.title}"?`} trigger="delete">
                  <form action={deleteBlockerAction} className="flex justify-end">
                    <input type="hidden" name="blockerId" value={blocker.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                  </form>
                </DialogAction>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{blocker.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              Aberto em {formatDate(blocker.openedAt)} | Empresa: {blocker.responsibleCompany ?? "-"} | Pessoa: {blocker.responsiblePerson ?? "-"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Impacto: {blocker.impactDescription ?? `${blocker.scheduleImpactDays} dias`} | {formatMoney(blocker.financialImpact)} | Proxima acao: {blocker.nextAction ?? "-"}
            </p>
          </article>
        ))}
        {!project.blockers.length ? <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhum bloqueio cadastrado.</div> : null}
      </div>
    </>
  );
}
