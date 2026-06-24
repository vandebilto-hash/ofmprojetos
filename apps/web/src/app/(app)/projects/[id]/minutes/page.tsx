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
                <p className="text-xs font-bold text-slate-500">{formatDate(minute.meetingDate)} | {minute.meetingType ?? "Reuniao"} | {minute.status}</p>
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
  return (
    <form action={upsertMeetingMinuteAction} className="grid gap-3">
      {minute ? <input type="hidden" name="minuteId" value={minute.id} /> : null}
      <input type="hidden" name="projectId" value={projectId} />
      <label className="grid gap-1 text-sm font-medium">Titulo<input name="title" required defaultValue={minute?.title ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Resumo<textarea name="summary" defaultValue={minute?.summary ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Data<input name="meetingDate" type="date" required defaultValue={inputDate(minute?.meetingDate ?? null)} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Tipo<select name="meetingType" defaultValue={minute?.meetingType ?? "Reunião de acompanhamento"} className="h-10 rounded-md border border-line px-3"><option value="Reunião de acompanhamento">Reunião de acompanhamento</option><option value="Reunião executiva">Reunião executiva</option><option value="Reunião técnica">Reunião técnica</option><option value="Comitê do projeto">Comitê do projeto</option><option value="Workshop">Workshop</option><option value="Outro">Outro</option></select></label><label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue={minute?.status ?? "Publicado"} className="h-10 rounded-md border border-line px-3"><option value="Rascunho">Rascunho</option><option value="Em revisão">Em revisão</option><option value="Publicado">Publicado</option><option value="Cancelado">Cancelado</option></select></label></div>
      <PeopleMultiSelect name="participants" label="Participantes" people={people} defaultValue={minute?.participants ?? ""} />
      <FileUpload name="fileUrl" label="Arquivo" defaultValue={minute?.fileUrl ?? ""} />
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
    </form>
  );
}
