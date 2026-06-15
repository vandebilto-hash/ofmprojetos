import { getServerSession } from "next-auth";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTable } from "@/features/projects/project-table";
import { authOptions } from "@/lib/auth/options";
import { canManageProject } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma/client";
import { importMppProjectAction } from "@/server/actions/projects";

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
            <form action={importMppProjectAction} className="grid gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Arquivo MPP, XML, MPX ou CSV
                <input name="file" type="file" accept=".mpp,.xml,.mpx,.csv,text/csv" required className="rounded-md border border-line px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Nome do projeto
                <input name="projectName" placeholder="Opcional. Se vazio, usa o nome do arquivo." className="h-10 rounded-md border border-line px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Projeto existente para atualizar
                <select name="existingProjectId" className="h-10 rounded-md border border-line px-3">
                  <option value="">Criar novo projeto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Cliente
                  <select name="clientId" required className="h-10 rounded-md border border-line px-3">
                    <option value="">Selecione o cliente</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Gestor
                  <select name="managerId" required defaultValue={session?.user.id ?? ""} className="h-10 rounded-md border border-line px-3">
                    <option value="">Selecione o gestor</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                No CSV, use colunas como EDT/WBS, Tarefa, Inicio, Fim, Horas, Avanco, Responsavel e Predecessoras. Recursos serao vinculados automaticamente quando o nome corresponder a um usuario ativo do Projete-se.
              </p>
              <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                Importar projeto
              </button>
            </form>
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
