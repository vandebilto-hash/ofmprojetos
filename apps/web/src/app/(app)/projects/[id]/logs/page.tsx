import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

const actionLabels: Record<string, string> = {
  CREATE: "Criacao",
  UPDATE: "Atualizacao",
  DELETE: "Exclusao",
  IMPORT: "Importacao"
};

export default async function ProjectLogsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true, name: true } });
  if (!project) notFound();

  const logs = await prisma.auditLog.findMany({
    where: { projectId: project.id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <>
      <PageHeader title={`Logs | ${project.name}`} description="Historico de acoes feitas no projeto, com horario, usuario e entidade afetada." />
      <ProjectTabs projectId={project.id} />
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Horario</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Acao</th>
                <th className="px-3 py-2">Entidade</th>
                <th className="px-3 py-2">Descricao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-ink">{log.actor?.name ?? "Sistema"}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{actionLabels[log.action] ?? log.action}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{log.entityType}</td>
                  <td className="px-3 py-3 text-slate-700">{log.description ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length ? <p className="mt-4 text-sm text-slate-500">Nenhum log registrado para este projeto.</p> : null}
      </section>
    </>
  );
}
