import { getServerSession } from "next-auth";
import { Suspense } from "react";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/features/tasks/task-form";
import { TaskFilters } from "@/features/tasks/task-filters";
import { TaskManagementTable } from "@/features/tasks/task-management-table";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { createBaselineAction } from "@/server/actions/projects";

export default async function TasksPage({
  searchParams
}: {
  searchParams: {
    projectId?: string;
    status?: string;
    ownerId?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  const canPointForOthers = ["ADMIN", "PROJECT_MANAGER"].includes(String(session?.user.role));
  const where = {
    ...(searchParams.projectId ? { projectId: searchParams.projectId } : {}),
    ...(searchParams.status ? { status: searchParams.status as never } : {}),
    ...(searchParams.ownerId ? { ownerId: searchParams.ownerId } : {}),
    ...(!canPointForOthers && session?.user.id
      ? {
          OR: [
            { ownerId: session.user.id },
            { participants: { some: { userId: session.user.id } } },
            { allocations: { some: { userId: session.user.id } } }
          ]
        }
      : {}),
    ...((searchParams.startDate || searchParams.endDate)
      ? {
          plannedEnd: {
            ...(searchParams.startDate ? { gte: new Date(`${searchParams.startDate}T00:00:00`) } : {}),
            ...(searchParams.endDate ? { lte: new Date(`${searchParams.endDate}T23:59:59`) } : {})
          }
        }
      : {})
  };

  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: true,
        owner: true,
        children: { select: { id: true } },
        predecessors: { include: { predecessor: true } }
      },
      orderBy: [{ projectId: "asc" }, { plannedEnd: "asc" }]
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  return (
    <>
      <PageHeader title="Tarefas" description="Visao operacional com filtros por prazo, projeto, status e responsavel." />
      <div className="mb-5 flex justify-end gap-2">
        <DialogAction title="Criar baseline" description="Salve um snapshot do cronograma e informe o projeto e motivo." trigger="create" triggerLabel="Nova baseline">
          <form action={createBaselineAction} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Projeto <span className="text-red-500">*</span>
              <select name="projectId" required className="h-10 rounded-md border border-line px-3">
                <option value="">Selecione o projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
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
        <DialogAction title="Criar tarefa" description="Cadastre uma nova tarefa e escolha o projeto vinculado." trigger="create" triggerLabel="Nova tarefa">
          <TaskForm users={users} projects={projects} tasks={tasks} />
        </DialogAction>
      </div>
      <Suspense fallback={<div className="mb-5 h-24 animate-pulse rounded-lg border border-line bg-white" />}>
        <TaskFilters
          projects={projects}
          users={users}
          defaultValues={{
            projectId: searchParams.projectId,
            status: searchParams.status,
            ownerId: searchParams.ownerId,
            startDate: searchParams.startDate,
            endDate: searchParams.endDate
          }}
        />
      </Suspense>
      <p className="mb-3 text-sm text-slate-500">{tasks.length} tarefa(s) encontrada(s).</p>
      <TaskManagementTable
        tasks={tasks}
        users={users}
        showProject
        canPointForOthers={canPointForOthers}
        currentUserId={session?.user.id}
      />
    </>
  );
}
