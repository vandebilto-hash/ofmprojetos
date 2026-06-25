import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { FileUpload } from "@/components/ui/file-upload";
import { PeopleSelect } from "@/components/ui/people-select";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { createMilestoneAction, deleteMilestoneAction, updateMilestoneAction } from "@/server/actions/projects";

const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

const milestoneStatusLabel: Record<string, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  DELAYED: "Atrasado"
};

export default async function ProjectMilestonesPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      milestones: { orderBy: { plannedDate: "asc" } },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } }
    }
  });
  if (!project) notFound();
  const people = getProjectPeople(project);

  return (
    <>
      <PageHeader title={`Marcos do projeto | ${project.name}`} description="Linha do tempo executiva dos eventos, entregas e aprovações." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar marco" description="Adicione um evento, entrega, aprovação ou decisão importante." trigger="create" triggerLabel="Novo marco">
          <form action={createMilestoneAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={project.id} />

            <div>
              <p className={sectionTitle}>Identificação</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className={labelClass}>
                  Nome <span className="text-red-500">*</span>
                  <input name="name" required className={inputClass} placeholder="Nome do marco" />
                </label>
                <label className={labelClass}>
                  Tipo <span className="text-red-500">*</span>
                  <select name="type" defaultValue="Entrega" className={selectClass} required>
                    <option value="Entrega">Entrega</option>
                    <option value="Aprovação">Aprovação</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Decisão">Decisão</option>
                    <option value="Marco contratual">Marco contratual</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
              </div>
              <label className={`${labelClass} mt-3`}>
                Descrição
                <textarea name="description" rows={3} className={textareaClass} placeholder="Descreva o marco" />
              </label>
            </div>

            <div>
              <p className={sectionTitle}>Cronograma</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <label className={labelClass}>
                  Data planejada <span className="text-red-500">*</span>
                  <input name="plannedDate" type="date" required className={inputClass} />
                </label>
                <label className={labelClass}>
                  Data real
                  <input name="actualDate" type="date" className={inputClass} />
                </label>
                <label className={labelClass}>
                  Status <span className="text-red-500">*</span>
                  <select name="status" defaultValue="PLANNED" className={selectClass} required>
                    <option value="PLANNED">Planejado</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="DELAYED">Atrasado</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <p className={sectionTitle}>Responsável e evidência</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <PeopleSelect name="owner" label="Responsável" people={people} required />
                <FileUpload name="evidenceUrl" label="Evidência" />
              </div>
            </div>

            <label className={`${labelClass} mt-1`}>
              Observações
              <textarea name="notes" rows={2} className={textareaClass} placeholder="Notas adicionais" />
            </label>

            <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                Cadastrar marco
              </button>
            </div>
          </form>
        </DialogAction>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="relative grid gap-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-line">
          {project.milestones.map((milestone) => (
            <div key={milestone.id} className="relative grid gap-3 pl-10 md:grid-cols-[160px_1fr_160px]">
              <span className="absolute left-[11px] top-2 h-3 w-3 rounded-full bg-brand-600" />
              <p className="text-sm font-semibold text-slate-500">{formatDate(milestone.plannedDate)}</p>
              <div>
                <h2 className="font-bold text-ink">{milestone.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{milestone.description ?? milestone.type ?? "Marco do projeto"}</p>
              </div>
              <div className="flex items-start justify-end gap-2">
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold text-slate-700">{milestoneStatusLabel[milestone.status]}</span>
                <DialogAction title="Editar marco" description={milestone.name} trigger="edit">
                  <form action={updateMilestoneAction} className="grid gap-4">
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />

                    <div>
                      <p className={sectionTitle}>Identificação</p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <label className={labelClass}>
                          Nome <span className="text-red-500">*</span>
                          <input name="name" required defaultValue={milestone.name} className={inputClass} />
                        </label>
                        <label className={labelClass}>
                          Tipo <span className="text-red-500">*</span>
                          <select name="type" defaultValue={milestone.type ?? "Entrega"} className={selectClass} required>
                            <option value="Entrega">Entrega</option>
                            <option value="Aprovação">Aprovação</option>
                            <option value="Reunião">Reunião</option>
                            <option value="Decisão">Decisão</option>
                            <option value="Marco contratual">Marco contratual</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </label>
                      </div>
                      <label className={`${labelClass} mt-3`}>
                        Descrição
                        <textarea name="description" defaultValue={milestone.description ?? ""} rows={3} className={textareaClass} />
                      </label>
                    </div>

                    <div>
                      <p className={sectionTitle}>Cronograma</p>
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <label className={labelClass}>
                          Data planejada <span className="text-red-500">*</span>
                          <input name="plannedDate" type="date" required defaultValue={inputDate(milestone.plannedDate)} className={inputClass} />
                        </label>
                        <label className={labelClass}>
                          Data real
                          <input name="actualDate" type="date" defaultValue={inputDate(milestone.actualDate)} className={inputClass} />
                        </label>
                        <label className={labelClass}>
                          Status <span className="text-red-500">*</span>
                          <select name="status" defaultValue={milestone.status} className={selectClass} required>
                            <option value="PLANNED">Planejado</option>
                            <option value="IN_PROGRESS">Em andamento</option>
                            <option value="COMPLETED">Concluído</option>
                            <option value="DELAYED">Atrasado</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className={sectionTitle}>Responsável e evidência</p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <PeopleSelect name="owner" label="Responsável" people={people} defaultValue={milestone.owner ?? ""} required />
                        <FileUpload name="evidenceUrl" label="Evidência" defaultValue={milestone.evidenceUrl ?? ""} />
                      </div>
                    </div>

                    <label className={`${labelClass} mt-1`}>
                      Observações
                      <textarea name="notes" defaultValue={milestone.notes ?? ""} rows={2} className={textareaClass} />
                    </label>

                    <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                      <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Salvar</button>
                    </div>
                  </form>
                </DialogAction>
                <DialogAction title="Excluir marco" description={`Deseja realmente excluir "${milestone.name}"?`} trigger="delete">
                  <form action={deleteMilestoneAction} className="flex justify-end">
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                  </form>
                </DialogAction>
              </div>
            </div>
          ))}
          {!project.milestones.length ? <p className="text-sm text-slate-500">Nenhum marco cadastrado.</p> : null}
        </div>
      </div>
    </>
  );
}
