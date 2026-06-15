import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { TaskForm } from "@/features/tasks/task-form";
import { TaskManagementTable } from "@/features/tasks/task-management-table";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { createBaselineAction } from "@/server/actions/projects";

export default async function ProjectTasksPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const canPointForOthers = ["ADMIN", "PROJECT_MANAGER"].includes(String(session?.user.role));
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      tasks: {
        include: { owner: true, children: { select: { id: true } }, predecessors: { include: { predecessor: true } } },
        orderBy: [{ plannedStart: "asc" }]
      }
    }
  });
  if (!project) notFound();

  const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title={`Tarefas | ${project.name}`}
        description="Criacao, edicao e exclusao direta das tarefas do projeto."
      />
      <ProjectTabs projectId={project.id} />
      <div className="grid gap-5">
        <div className="flex justify-end gap-2">
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
          <DialogAction title="Criar tarefa" description="Cadastre uma nova tarefa para este projeto." trigger="create" triggerLabel="Nova tarefa">
            <TaskForm projectId={project.id} users={users} tasks={project.tasks} />
          </DialogAction>
        </div>
        <TaskManagementTable
          tasks={project.tasks}
          users={users}
          canPointForOthers={canPointForOthers}
          currentUserId={session?.user.id}
        />
      </div>
    </>
  );
}
