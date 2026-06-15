import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "Criacao",
    UPDATE: "Edicao",
    DELETE: "Exclusao",
    MOVE_STATUS: "Mudanca de status",
    UPDATE_METADATA: "Edicao de metadados"
  };
  return labels[action] ?? action;
}

function entityLabel(entity: string) {
  const labels: Record<string, string> = {
    Project: "Projeto",
    Task: "Tarefa",
    Baseline: "Baseline",
    Blocker: "Bloqueio",
    ResourceAllocation: "Recurso"
  };
  return labels[entity] ?? entity;
}

function responsibleName(log: { after: unknown; before: unknown }, users: { id: string; name: string }[]) {
  const data = (log.after ?? log.before ?? {}) as Record<string, unknown>;
  const responsibleId =
    data.ownerId ?? data.resolverId ?? data.userId ?? data.createdById ?? data.managerId ?? data.responsibleId;
  if (typeof responsibleId !== "string") return "Nao informado";
  return users.find((user) => user.id === responsibleId)?.name ?? "Nao informado";
}

function targetName(log: { after: unknown; before: unknown; entityType: string }) {
  const data = (log.after ?? log.before ?? {}) as Record<string, unknown>;
  if (typeof data.name === "string") return data.name;
  if (typeof data.title === "string") return data.title;
  return entityLabel(log.entityType);
}

export default async function ProjectHistoryPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();
  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: project.id },
          { after: { path: ["projectId"], equals: project.id } },
          { before: { path: ["projectId"], equals: project.id } }
        ]
      },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.user.findMany({ select: { id: true, name: true } })
  ]);

  return (
    <>
      <PageHeader title={`Historico | ${project.name}`} description="Auditoria de alteracoes relevantes." />
      <ProjectTabs projectId={project.id} />
      <div className="relative grid gap-3 pl-6 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-px before:bg-line">
        {logs.map((log) => (
          <article key={log.id} className="relative rounded-lg border border-line bg-white p-4 text-sm shadow-soft">
            <span className="absolute -left-[23px] top-5 h-3 w-3 rounded-full border-2 border-white bg-brand-600 shadow" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-700">{entityLabel(log.entityType)}</p>
                <h2 className="mt-1 font-bold text-ink">{actionLabel(log.action)}: {targetName(log)}</h2>
              </div>
              <time className="rounded-md bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {format(log.createdAt, "dd/MM/yyyy HH:mm")}
              </time>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Quem fez a alteracao</p>
                <p className="mt-1 font-semibold">{log.actor?.name ?? "Sistema"}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Responsavel relacionado</p>
                <p className="mt-1 font-semibold">{responsibleName(log, users)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Data e horario</p>
                <p className="mt-1 font-semibold">{format(log.createdAt, "dd/MM/yyyy 'as' HH:mm")}</p>
              </div>
            </div>
          </article>
        ))}
        {!logs.length ? <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhum log registrado para este projeto.</div> : null}
      </div>
    </>
  );
}
