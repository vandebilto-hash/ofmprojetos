import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { GanttView } from "@/features/gantt/gantt-view";
import { ImportMppForm } from "@/features/projects/import-mpp-form";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { TaskForm } from "@/features/tasks/task-form";
import { prisma } from "@/lib/prisma/client";
import { confirmMppImportAction } from "@/server/actions/projects";

export default async function ProjectGanttPage({ params, searchParams }: { params: { id: string }; searchParams: { importPreview?: string; importStatus?: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { plannedStart: "asc" } },
      baselines: { include: { tasks: true }, orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] },
      client: true,
      manager: true
    }
  });
  if (!project) notFound();
  const dependencies = await prisma.taskDependency.findMany({
    where: { predecessor: { projectId: project.id } }
  });
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  const importPreview = searchParams.importPreview
    ? await prisma.systemSetting.findUnique({ where: { key: searchParams.importPreview } })
    : null;
  const previewValue = importPreview?.value as any;

  return (
    <>
      <PageHeader title={`Planejamento | ${project.name}`} description="Cronograma, EDT, horas e importacao MPP para criar ou atualizar atividades." />
      <ProjectTabs projectId={project.id} />
      {searchParams.importStatus === "nochanges" ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Nenhuma alteracao encontrada no arquivo importado. O cronograma atual foi mantido.
        </div>
      ) : null}
      {previewValue?.changes?.length ? (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-amber-950">Confirmar atualizacao do cronograma</h2>
              <p className="mt-1 text-sm text-amber-900">Foram encontradas alteracoes em {previewValue.changes.length} atividade(s). Revise antes de aplicar.</p>
            </div>
            <form action={confirmMppImportAction}>
              <input type="hidden" name="previewKey" value={searchParams.importPreview} />
              <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Confirmar alteracoes</button>
            </form>
          </div>
          <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-amber-200 bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-amber-100 text-amber-950"><tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">EDT</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2">Alteracoes</th></tr></thead>
              <tbody className="divide-y divide-amber-100">
                {previewValue.changes.map((change: any, index: number) => (
                  <tr key={`${change.wbs}-${change.task}-${index}`}>
                    <td className="px-3 py-2 font-bold">{change.type === "CREATE" ? "Nova" : "Atualizar"}</td>
                    <td className="px-3 py-2 font-bold text-ink">{change.wbs ?? "-"}</td>
                    <td className="px-3 py-2">{change.task}</td>
                    <td className="px-3 py-2">
                      {change.fields?.length ? change.fields.map((field: any) => `${field.field}: ${field.current || "-"} -> ${field.next || "-"}`).join(" | ") : "Atividade nova"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <DialogAction title="Nova atividade" description="Cadastre uma atividade manualmente no cronograma." trigger="create" triggerLabel="Nova atividade">
          <TaskForm projectId={project.id} users={users} tasks={project.tasks} />
        </DialogAction>
        <DialogAction title="Importar MPP" description="Envie um arquivo MPP/XML/MPX/CSV para criar ou atualizar as atividades deste projeto." trigger="create" triggerLabel="Importar MPP">
          <ImportMppForm projectId={project.id} clientId={project.clientId} managerId={project.managerId} />
        </DialogAction>
      </div>
      <GanttView tasks={project.tasks} baselines={project.baselines} dependencies={dependencies} />
    </>
  );
}
