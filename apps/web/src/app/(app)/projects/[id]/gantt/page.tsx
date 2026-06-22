import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { GanttView } from "@/features/gantt/gantt-view";
import { ImportMppForm } from "@/features/projects/import-mpp-form";
import { ImportOptionsDialog } from "@/features/projects/import-options-dialog";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { TaskForm } from "@/features/tasks/task-form";
import { TaskManagementTable } from "@/features/tasks/task-management-table";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma/client";
import { createBaselineAction } from "@/server/actions/projects";

export default async function ProjectGanttPage({ params, searchParams }: { params: { id: string }; searchParams: { importPreview?: string; importStatus?: string } }) {
  const session = await getServerSession(authOptions);
  const canPointForOthers = ["ADMIN", "PROJECT_MANAGER"].includes(String(session?.user.role));
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: { owner: true, children: { select: { id: true } }, predecessors: { include: { predecessor: true } } },
        orderBy: { plannedStart: "asc" }
      },
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
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((task) => task.status === "DONE").length;
  const delayedTasks = project.tasks.filter((task) => task.plannedEnd < new Date() && task.status !== "DONE").length;
  const progress = totalTasks ? Math.round(project.tasks.reduce((sum, task) => sum + Number(task.progressPercent), 0) / totalTasks) : 0;

  return (
    <>
      <PageHeader title={`Cronograma | ${project.name}`} description="Gantt, importacao MPP, baselines e gestao operacional das tarefas em um unico fluxo." />
      <ProjectTabs projectId={project.id} />
      {searchParams.importStatus === "nochanges" ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Nenhuma alteracao encontrada no arquivo importado. O cronograma atual foi mantido.
        </div>
      ) : null}
      {previewValue?.changes?.length ? (
        <ImportOptionsDialog previewKey={searchParams.importPreview!} changes={previewValue.changes} />
      ) : null}
      <section className="mb-5 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-gradient-to-r from-brand-50 to-slate-50 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Planejamento integrado</p>
            <h2 className="mt-1 text-2xl font-black text-ink">Cronograma e execucao no mesmo lugar</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Importe MPP, crie baselines, visualize o Gantt e atualize status, progresso, horas e responsaveis na lista To-do abaixo.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
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
            <DialogAction title="Nova atividade" description="Cadastre uma atividade manualmente no cronograma." trigger="create" triggerLabel="Nova atividade">
              <TaskForm projectId={project.id} users={users} tasks={project.tasks} />
            </DialogAction>
            <DialogAction title="Importar MPP" description="Envie um arquivo MPP/XML/MPX/CSV para criar ou atualizar as atividades deste projeto." trigger="create" triggerLabel="Importar MPP">
              <ImportMppForm projectId={project.id} clientId={project.clientId} managerId={project.managerId} />
            </DialogAction>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-4">
          <Metric title="Atividades" value={totalTasks} detail={`${doneTasks} concluida(s)`} />
          <Metric title="Progresso medio" value={`${progress}%`} detail="Atualizado pelas tarefas" />
          <Metric title="Atrasadas" value={delayedTasks} detail="Fim planejado vencido" tone={delayedTasks ? "red" : "green"} />
          <Metric title="Baselines" value={project.baselines.length} detail="Snapshots do cronograma" />
        </div>
      </section>

      <div className="grid gap-6">
        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">Gantt e baseline</h2>
            <p className="text-sm text-slate-500">Visao temporal para sequenciamento, atrasos e comparacao com baselines.</p>
          </div>
          <GanttView tasks={project.tasks} baselines={project.baselines} dependencies={dependencies} />
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">To-do operacional</h2>
            <p className="text-sm text-slate-500">Edite atividades, status, responsaveis, horas, progresso, ocorrencias e predecessoras sem sair do planejamento.</p>
          </div>
          <TaskManagementTable
            tasks={project.tasks}
            users={users}
            canPointForOthers={canPointForOthers}
            currentUserId={session?.user.id}
          />
        </section>
      </div>
    </>
  );
}

function Metric({ title, value, detail, tone = "slate" }: { title: string; value: string | number; detail: string; tone?: "slate" | "red" | "green" }) {
  const toneClass = tone === "red" ? "text-red-700 bg-red-50" : tone === "green" ? "text-emerald-700 bg-emerald-50" : "text-slate-700 bg-slate-50";
  return (
    <div className={`rounded-xl border border-line p-4 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-70">{detail}</p>
    </div>
  );
}
