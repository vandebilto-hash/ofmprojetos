import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { createBaselineAction, deleteBaselineAction, updateBaselineAction } from "@/server/actions/projects";

export default async function ProjectBaselinesPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { baselines: { include: { tasks: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader title={`Baselines | ${project.name}`} description="Snapshots imutaveis do cronograma." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Criar baseline" description="Salve um snapshot do cronograma atual e informe o motivo." trigger="create" triggerLabel="Nova baseline">
          <form action={createBaselineAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="grid gap-1 text-sm font-medium">
              Nome
              <input name="name" placeholder="Nome da baseline" className="h-10 rounded-md border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Descricao
              <input name="description" placeholder="Descricao" className="h-10 rounded-md border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Motivo <span className="text-red-500">*</span>
              <textarea name="reason" placeholder="Justificativa obrigatoria para criacao da baseline" rows={3} required className="rounded-md border border-line px-3 py-2" />
            </label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Criar baseline</button>
          </form>
        </DialogAction>
      </div>
      <div className="grid gap-3">
        {project.baselines.map((baseline) => (
          <div key={baseline.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{baseline.name}</h2>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{baseline.description}</p>
              </div>
              <div className="flex gap-2">
                <DialogAction title="Editar baseline" description={baseline.name} trigger="edit">
                  <form action={updateBaselineAction} className="grid gap-3">
                    <input type="hidden" name="baselineId" value={baseline.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <label className="grid gap-1 text-sm font-medium">
                      Nome
                      <input name="name" defaultValue={baseline.name} className="h-10 rounded-md border border-line px-3" />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Descricao e motivo
                      <textarea name="description" defaultValue={baseline.description ?? ""} rows={5} className="rounded-md border border-line px-3 py-2" />
                    </label>
                    <label className="flex h-10 items-center gap-2 text-sm font-medium">
                      <input name="isActive" type="checkbox" defaultChecked={baseline.isActive} value="true" />
                      Definir como baseline ativa
                    </label>
                    <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                      Salvar baseline
                    </button>
                  </form>
                </DialogAction>
                <DialogAction title="Excluir baseline" description={`Deseja realmente excluir "${baseline.name}"?`} trigger="delete">
                  <form action={deleteBaselineAction} className="flex justify-end">
                    <input type="hidden" name="baselineId" value={baseline.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                      Sim, excluir
                    </button>
                  </form>
                </DialogAction>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
              <span>Criada: {formatDate(baseline.createdAt)}</span>
              <span>Tarefas: {baseline.tasks.length}</span>
              <span>Primeira tarefa: {baseline.tasks[0] ? formatDate(baseline.tasks[0].plannedStart) : "-"}</span>
              <span>Horas snapshot: {formatHours(baseline.tasks.reduce((sum, task) => sum + Number(task.estimatedHours), 0))}</span>
            </div>
            <div className="mt-3 text-sm">
              <span className="font-medium">Justificativa:</span>{" "}
              <span className="text-slate-600">{baseline.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
