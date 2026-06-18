import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { GanttView } from "@/features/gantt/gantt-view";
import { ImportMppForm } from "@/features/projects/import-mpp-form";
import { ImportOptionsDialog } from "@/features/projects/import-options-dialog";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { TaskForm } from "@/features/tasks/task-form";
import { prisma } from "@/lib/prisma/client";

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
        <ImportOptionsDialog previewKey={searchParams.importPreview!} changes={previewValue.changes} />
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
