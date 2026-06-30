import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { FileUpload } from "@/components/ui/file-upload";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { deleteMeetingMinuteAction, upsertMeetingMinuteAction } from "@/server/actions/projects";

const visibilityLabel: Record<string, string> = {
  INTERNAL: "Interno OFM",
  PROJECT_TEAM: "Equipe do projeto",
  CLIENT_VISIBLE: "Público / cliente"
};

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProjectMinutesPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      meetingMinutes: { orderBy: { meetingDate: "desc" } },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } }
    }
  });
  if (!project) notFound();
  const people = getProjectPeople(project);

  return (
    <>
      <PageHeader title={`Atas | ${project.name}`} description="Cadastro de atas, decisoes, participantes e links publicados no portal do cliente." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar ata" description="Inclua uma ata ou registro de reuniao." trigger="create" triggerLabel="Nova ata">
          <MinuteForm projectId={project.id} people={people} />
        </DialogAction>
      </div>
      <section className="grid gap-3">
        {project.meetingMinutes.map((minute) => (
          <article key={minute.id} className="rounded-lg border border-line bg-white p-4 text-sm shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">{formatDate(minute.meetingDate)} | {minute.meetingType ?? "Reuniao"} | {minute.status} | {visibilityLabel[minute.visibility] ?? "Equipe do projeto"}</p>
                <h2 className="mt-1 font-bold text-ink">{minute.title}</h2>
                <p className="mt-1 text-slate-600">{minute.summary}</p>
                <p className="mt-2 text-xs text-slate-500">Participantes: {minute.participants ?? "-"}</p>
              </div>
              <div className="flex gap-2">
                <DialogAction title="Editar ata" description={minute.title} trigger="edit">
                  <MinuteForm projectId={project.id} minute={minute} people={people} />
                </DialogAction>
                <DialogAction title="Excluir ata" description={`Deseja realmente excluir "${minute.title}"?`} trigger="delete">
                  <form action={deleteMeetingMinuteAction} className="flex justify-end">
                    <input type="hidden" name="minuteId" value={minute.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                  </form>
                </DialogAction>
              </div>
            </div>
          </article>
        ))}
        {!project.meetingMinutes.length ? <p className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhuma ata cadastrada.</p> : null}
      </section>
    </>
  );
}

function MinuteForm({ projectId, minute, people }: { projectId: string; minute?: any; people: string[] }) {
  const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
  const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
  const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  return (
    <form action={upsertMeetingMinuteAction} className="grid gap-4">
      {minute ? <input type="hidden" name="minuteId" value={minute.id} /> : null}
      <input type="hidden" name="projectId" value={projectId} />

      <div>
        <p className={sectionTitle}>Identificação</p>
        <div className="mt-2 grid gap-3">
          <label className={labelClass}>
            Título <span className="text-red-500">*</span>
            <input name="title" required defaultValue={minute?.title ?? ""} className={inputClass} placeholder="Título da ata" />
          </label>
          <label className={labelClass}>
            Resumo <span className="text-red-500">*</span>
            <textarea name="summary" required defaultValue={minute?.summary ?? ""} rows={3} className={textareaClass} placeholder="Resumo da reunião" />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Detalhes</p>
        <div className="mt-2 grid grid-cols-4 gap-3">
          <label className={labelClass}>
            Data <span className="text-red-500">*</span>
            <input name="meetingDate" type="date" required defaultValue={inputDate(minute?.meetingDate ?? null)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Tipo <span className="text-red-500">*</span>
            <select name="meetingType" defaultValue={minute?.meetingType ?? "Reunião de acompanhamento"} className={selectClass} required>
              <option value="Reunião de acompanhamento">Reunião de acompanhamento</option>
              <option value="Reunião executiva">Reunião executiva</option>
              <option value="Reunião técnica">Reunião técnica</option>
              <option value="Comitê do projeto">Comitê do projeto</option>
              <option value="Workshop">Workshop</option>
              <option value="Outro">Outro</option>
            </select>
          </label>
          <label className={labelClass}>
            Status <span className="text-red-500">*</span>
            <select name="status" defaultValue={minute?.status ?? "Publicado"} className={selectClass} required>
              <option value="Rascunho">Rascunho</option>
              <option value="Em revisão">Em revisão</option>
              <option value="Publicado">Publicado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>
          <label className={labelClass}>
            Visibilidade <span className="text-red-500">*</span>
            <select name="visibility" defaultValue={minute?.visibility ?? "PROJECT_TEAM"} className={selectClass} required>
              <option value="INTERNAL">Interno OFM</option>
              <option value="PROJECT_TEAM">Equipe do projeto</option>
              <option value="CLIENT_VISIBLE">Público / cliente</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Participantes e anexo</p>
        <div className="mt-2 grid gap-3">
          <PeopleMultiSelect name="participants" label="Participantes" people={people} defaultValue={minute?.participants ?? ""} />
          <FileUpload name="fileUrl" label="Arquivo" defaultValue={minute?.fileUrl ?? ""} />
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          Salvar
        </button>
      </div>
    </form>
  );
}
