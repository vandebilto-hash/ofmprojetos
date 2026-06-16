import { getServerSession } from "next-auth";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ImportProjectForm } from "@/features/projects/import-project-form";
import { ProjectTable } from "@/features/projects/project-table";
import { authOptions } from "@/lib/auth/options";
import { canManageProject } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  const canManage = canManageProject(session?.user.role);
  const [projects, clients, managers] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...(session?.user.role === "CLIENT" ? { clientId: session.user.clientId ?? "__none__" } : {}),
        ...(searchParams.q ? { name: { contains: searchParams.q, mode: "insensitive" } } : {}),
        ...(searchParams.status ? { status: searchParams.status as never } : {})
      },
      include: { client: true, manager: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.client.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { name: { in: ["ADMIN", "PROJECT_MANAGER"] } } },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Filtro por cliente, status, responsavel, atraso e conclusao."
        action={canManage ? { href: "/projects/new", label: "Novo projeto" } : undefined}
      />
      {canManage ? (
        <div className="mb-4 flex justify-end">
          <DialogAction title="Importar projeto" description="Importe arquivos MS Project ou CSV para criar projeto, tarefas, predecessoras e recursos reconhecidos." trigger="create" triggerLabel="Importar projeto">
            <ImportProjectForm
              projects={projects}
              clients={clients}
              managers={managers}
              defaultManagerId={session?.user.id ?? ""}
            />
          </DialogAction>
        </div>
      ) : null}
      <form className="mb-4 grid grid-cols-[1fr_220px_auto] gap-3 rounded-lg border border-line bg-white p-3 shadow-soft">
        <input name="q" placeholder="Buscar projeto" className="h-10 rounded-md border border-line px-3" />
        <select name="status" className="h-10 rounded-md border border-line px-3">
          <option value="">Todos os status</option>
          <option value="PLANNED">Planejado</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="BLOCKED">Bloqueado</option>
          <option value="COMPLETED">Concluido</option>
        </select>
        <button className="rounded-md bg-ink px-4 text-sm font-semibold text-white">Filtrar</button>
      </form>
      <ProjectTable projects={projects} canManage={canManage} />
    </>
  );
}
