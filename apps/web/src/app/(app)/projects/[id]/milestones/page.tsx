import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { createMilestoneAction, deleteMilestoneAction, updateMilestoneAction } from "@/server/actions/projects";

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
    include: { milestones: { orderBy: { plannedDate: "asc" } } }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader title={`Marcos do projeto | ${project.name}`} description="Linha do tempo executiva dos eventos, entregas e aprovações." />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar marco" description="Adicione um evento, entrega, aprovação ou decisão importante." trigger="create" triggerLabel="Novo marco">
          <form action={createMilestoneAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Tipo<input name="type" placeholder="Entrega, aprovação, reunião..." className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Descrição<textarea name="description" rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Data planejada<input name="plannedDate" type="date" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Data real<input name="actualDate" type="date" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue="PLANNED" className="h-10 rounded-md border border-line px-3"><option value="PLANNED">Planejado</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="DELAYED">Atrasado</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Responsável<input name="owner" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Evidência/link<input name="evidenceUrl" type="url" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Observações<textarea name="notes" rows={2} className="rounded-md border border-line px-3 py-2" /></label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar marco</button>
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
                  <form action={updateMilestoneAction} className="grid gap-3">
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Nome<input name="name" required defaultValue={milestone.name} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Tipo<input name="type" defaultValue={milestone.type ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                    <label className="grid gap-1 text-sm font-medium">Descrição<textarea name="description" defaultValue={milestone.description ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
                    <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Data planejada<input name="plannedDate" type="date" required defaultValue={inputDate(milestone.plannedDate)} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Data real<input name="actualDate" type="date" defaultValue={inputDate(milestone.actualDate)} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue={milestone.status} className="h-10 rounded-md border border-line px-3"><option value="PLANNED">Planejado</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="DELAYED">Atrasado</option></select></label></div>
                    <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Responsável<input name="owner" defaultValue={milestone.owner ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Evidência/link<input name="evidenceUrl" type="url" defaultValue={milestone.evidenceUrl ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                    <label className="grid gap-1 text-sm font-medium">Observações<textarea name="notes" defaultValue={milestone.notes ?? ""} rows={2} className="rounded-md border border-line px-3 py-2" /></label>
                    <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
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
