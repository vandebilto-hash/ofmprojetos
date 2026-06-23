import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { createRiskAction, deleteBlockerAction, deleteRiskAction, updateRiskAction, upsertBlockerAction } from "@/server/actions/projects";

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProjectBlockersPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      blockers: { include: { task: true }, orderBy: { createdAt: "desc" } },
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
      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Riscos</p><p className="mt-2 text-2xl font-bold">{project.risks.length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Criticos/altos</p><p className="mt-2 text-2xl font-bold">{project.risks.filter((risk) => risk.classification === "CRITICAL" || risk.classification === "HIGH").length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Bloqueios</p><p className="mt-2 text-2xl font-bold">{project.blockers.length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Abertos</p><p className="mt-2 text-2xl font-bold">{project.blockers.filter((blocker) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED").length}</p></div>
      </section>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <DialogAction title="Cadastrar risco" description="Inclua um novo risco na matriz do projeto." trigger="create" triggerLabel="Novo risco">
          <form action={createRiskAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Nome do risco<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Classificacao<select name="classification" defaultValue="MEDIUM" className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixo</option><option value="MEDIUM">Medio</option><option value="HIGH">Alto</option><option value="CRITICAL">Critico</option></select></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Descricao<textarea name="description" rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Probabilidade<select name="probability" defaultValue="MEDIUM" className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixa</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option></select></label>
              <label className="grid gap-1 text-sm font-medium">Estrategia<select name="responseStrategy" defaultValue="MITIGATE" className="h-10 rounded-md border border-line px-3"><option value="MITIGATE">Mitigar</option><option value="ACCEPT">Aceitar</option><option value="TRANSFER">Transferir</option><option value="AVOID">Evitar</option></select></label>
              <label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue="OPEN" className="h-10 rounded-md border border-line px-3"><option value="OPEN">Aberto</option><option value="IN_TREATMENT">Em tratamento</option><option value="MATERIALIZED">Materializado</option><option value="CLOSED">Encerrado</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Causa<input name="cause" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Evento<input name="event" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Impacto<textarea name="impact" rows={2} className="rounded-md border border-line px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Acoes preventivas<textarea name="preventiveActions" rows={2} className="rounded-md border border-line px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Plano de contingencia<textarea name="contingencyPlan" rows={2} className="rounded-md border border-line px-3 py-2" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Gatilhos<input name="triggers" className="h-10 rounded-md border border-line px-3" /></label>
              <PeopleMultiSelect name="owner" label="Responsavel" people={people} />
              <label className="grid gap-1 text-sm font-medium">Ultima revisao<input name="lastReviewAt" type="date" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Observacoes<textarea name="notes" rows={2} className="rounded-md border border-line px-3 py-2" /></label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar risco</button>
          </form>
        </DialogAction>
        <DialogAction title="Cadastrar bloqueio" description="Registre um impedimento do projeto ou de uma tarefa." trigger="create" triggerLabel="Novo bloqueio">
          <form action={upsertBlockerAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="grid gap-1 text-sm font-medium">
              Titulo
              <input name="title" required placeholder="Titulo do bloqueio" className="h-10 rounded-md border border-line px-3" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Data de abertura
                <input name="openedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-md border border-line px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Previsao de resolucao
                <input name="expectedResolutionAt" type="date" className="h-10 rounded-md border border-line px-3" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Descricao
              <textarea name="description" rows={3} placeholder="Descricao do bloqueio" className="rounded-md border border-line px-3 py-2" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Tarefa relacionada
                <select name="taskId" className="h-10 rounded-md border border-line px-3">
                  <option value="">Projeto geral</option>
                  {project.tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Empresa responsavel
                <input name="responsibleCompany" className="h-10 rounded-md border border-line px-3" />
              </label>
            </div>
            <PeopleMultiSelect name="responsiblePerson" label="Pessoa responsavel" people={people} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Status
                <select name="status" defaultValue="OPEN" className="h-10 rounded-md border border-line px-3">
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Responsavel pela resolucao
                <select name="resolverId" className="h-10 rounded-md border border-line px-3">
                  <option value="">Responsavel</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Impacto no cronograma em dias
                <input name="scheduleImpactDays" type="number" defaultValue="0" placeholder="Impacto em dias" className="h-10 rounded-md border border-line px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Impacto financeiro
                <input name="financialImpact" type="number" step="0.01" defaultValue="0" placeholder="Impacto financeiro" className="h-10 rounded-md border border-line px-3" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Impacto no projeto
              <textarea name="impactDescription" rows={2} className="rounded-md border border-line px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Proxima acao
              <textarea name="nextAction" rows={2} className="rounded-md border border-line px-3 py-2" />
            </label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar bloqueio</button>
          </form>
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
                    <form action={updateRiskAction} className="grid gap-3">
                      <input type="hidden" name="riskId" value={risk.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Nome do risco<input name="name" required defaultValue={risk.name} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Classificacao<select name="classification" defaultValue={risk.classification} className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixo</option><option value="MEDIUM">Medio</option><option value="HIGH">Alto</option><option value="CRITICAL">Critico</option></select></label></div>
                      <label className="grid gap-1 text-sm font-medium">Descricao<textarea name="description" defaultValue={risk.description ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
                      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Probabilidade<select name="probability" defaultValue={risk.probability} className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixa</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option></select></label><label className="grid gap-1 text-sm font-medium">Estrategia<select name="responseStrategy" defaultValue={risk.responseStrategy} className="h-10 rounded-md border border-line px-3"><option value="MITIGATE">Mitigar</option><option value="ACCEPT">Aceitar</option><option value="TRANSFER">Transferir</option><option value="AVOID">Evitar</option></select></label><label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue={risk.status} className="h-10 rounded-md border border-line px-3"><option value="OPEN">Aberto</option><option value="IN_TREATMENT">Em tratamento</option><option value="MATERIALIZED">Materializado</option><option value="CLOSED">Encerrado</option></select></label></div>
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Causa<input name="cause" defaultValue={risk.cause ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Evento<input name="event" defaultValue={risk.event ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <label className="grid gap-1 text-sm font-medium">Impacto<textarea name="impact" defaultValue={risk.impact ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" /></label>
                      <label className="grid gap-1 text-sm font-medium">Acoes preventivas<textarea name="preventiveActions" defaultValue={risk.preventiveActions ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" /></label>
                      <label className="grid gap-1 text-sm font-medium">Plano de contingencia<textarea name="contingencyPlan" defaultValue={risk.contingencyPlan ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" /></label>
                      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Gatilhos<input name="triggers" defaultValue={risk.triggers ?? ""} className="h-10 rounded-md border border-line px-3" /></label><PeopleMultiSelect name="owner" label="Responsavel" people={people} defaultValue={risk.owner ?? ""} /><label className="grid gap-1 text-sm font-medium">Ultima revisao<input name="lastReviewAt" type="date" defaultValue={inputDate(risk.lastReviewAt)} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <label className="grid gap-1 text-sm font-medium">Observacoes<textarea name="notes" defaultValue={risk.notes ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" /></label>
                      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
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
      <div className="grid gap-3">
        {project.blockers.map((blocker) => (
          <article key={blocker.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-bold">{blocker.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{blocker.task?.name ?? "Projeto geral"}</p>
              </div>
              <div className="flex items-start gap-2">
                <StatusBadge status={blocker.status} />
                <DialogAction title="Editar bloqueio" description={blocker.title} trigger="edit">
                  <form action={upsertBlockerAction} className="grid gap-3">
                    <input type="hidden" name="blockerId" value={blocker.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <label className="grid gap-1 text-sm font-medium">
                      Titulo
                      <input name="title" defaultValue={blocker.title} className="h-10 rounded-md border border-line px-3" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm font-medium">
                        Data de abertura
                        <input name="openedAt" type="date" defaultValue={inputDate(blocker.openedAt)} className="h-10 rounded-md border border-line px-3" />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Previsao de resolucao
                        <input name="expectedResolutionAt" type="date" defaultValue={inputDate(blocker.expectedResolutionAt)} className="h-10 rounded-md border border-line px-3" />
                      </label>
                    </div>
                    <label className="grid gap-1 text-sm font-medium">
                      Descricao
                      <textarea name="description" defaultValue={blocker.description ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm font-medium">
                        Tarefa relacionada
                        <select name="taskId" defaultValue={blocker.taskId ?? ""} className="h-10 rounded-md border border-line px-3">
                          <option value="">Projeto geral</option>
                          {project.tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Empresa responsavel
                        <input name="responsibleCompany" defaultValue={blocker.responsibleCompany ?? ""} className="h-10 rounded-md border border-line px-3" />
                      </label>
                    </div>
                    <PeopleMultiSelect name="responsiblePerson" label="Pessoa responsavel" people={people} defaultValue={blocker.responsiblePerson ?? ""} />
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm font-medium">
                        Status
                        <select name="status" defaultValue={blocker.status} className="h-10 rounded-md border border-line px-3">
                          <option value="OPEN">Aberto</option>
                          <option value="IN_PROGRESS">Em andamento</option>
                          <option value="RESOLVED">Resolvido</option>
                          <option value="CANCELED">Cancelado</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Responsavel pela resolucao
                        <select name="resolverId" defaultValue={blocker.resolverId ?? ""} className="h-10 rounded-md border border-line px-3">
                          <option value="">Responsavel</option>
                          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm font-medium">
                        Impacto no cronograma em dias
                        <input name="scheduleImpactDays" type="number" defaultValue={blocker.scheduleImpactDays} className="h-10 rounded-md border border-line px-3" />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Impacto financeiro
                        <input name="financialImpact" type="number" step="0.01" defaultValue={Number(blocker.financialImpact)} className="h-10 rounded-md border border-line px-3" />
                      </label>
                    </div>
                    <label className="grid gap-1 text-sm font-medium">
                      Impacto no projeto
                      <textarea name="impactDescription" defaultValue={blocker.impactDescription ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Proxima acao
                      <textarea name="nextAction" defaultValue={blocker.nextAction ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" />
                    </label>
                    <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar bloqueio</button>
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
