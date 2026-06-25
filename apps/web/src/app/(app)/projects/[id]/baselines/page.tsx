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
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome <span className="text-red-500">*</span>
              <input name="name" required placeholder="Nome da baseline" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descrição <span className="text-red-500">*</span>
              <input name="description" required placeholder="Descrição" className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Motivo <span className="text-red-500">*</span>
              <textarea name="reason" placeholder="Justificativa obrigatória para criação da baseline" rows={3} required className="min-h-[80px] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
            </label>
            <button className="w-fit inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Criar baseline</button>
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
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Nome <span className="text-red-500">*</span>
                      <input name="name" required defaultValue={baseline.name} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                    </label>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Descrição e motivo
                      <textarea name="description" defaultValue={baseline.description ?? ""} rows={5} className="min-h-[80px] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                    </label>
                    <label className="flex h-10 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <input name="isActive" type="checkbox" defaultChecked={baseline.isActive} value="true" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      Definir como baseline ativa
                    </label>
                    <button className="w-fit inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                      Salvar baseline
                    </button>
                  </form>
                </DialogAction>
                <DialogAction title="Excluir baseline" description={`Deseja realmente excluir "${baseline.name}"?`} trigger="delete">
                  <form action={deleteBaselineAction} className="flex justify-end">
                    <input type="hidden" name="baselineId" value={baseline.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700">
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
