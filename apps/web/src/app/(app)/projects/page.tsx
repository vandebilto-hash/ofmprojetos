import { getServerSession } from "next-auth";
import { Download, Search, SlidersHorizontal } from "lucide-react";
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
  const exportParams = new URLSearchParams();
  if (searchParams.q) exportParams.set("q", searchParams.q);
  if (searchParams.status) exportParams.set("status", searchParams.status);
  const exportHref = `/api/export/projects${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;
  const mspdiExportParams = new URLSearchParams(exportParams);
  mspdiExportParams.set("format", "mspdi");
  const mspdiExportHref = `/api/export/projects?${mspdiExportParams.toString()}`;

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
        description={`${projects.length} projeto${projects.length !== 1 ? "s" : ""} encontrado${projects.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={exportHref}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111c31] dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download size={15} aria-hidden="true" />
              Exportar CSV
            </a>
            <a
              href={mspdiExportHref}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111c31] dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download size={15} aria-hidden="true" />
              Exportar MPP
            </a>
            {canManage ? (
              <>
              <DialogAction
                title="Importar projeto"
                description="Importe arquivos MS Project ou CSV para criar projeto, tarefas, predecessoras e recursos."
                trigger="create"
                triggerLabel="Importar"
              >
                <ImportProjectForm
                  projects={projects}
                  clients={clients}
                  managers={managers}
                  defaultManagerId={session?.user.id ?? ""}
                />
              </DialogAction>
              <a
                href="/projects/new"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Novo projeto
              </a>
              </>
            ) : null}
          </div>
        }
      />

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-3 shadow-soft dark:bg-[#111c31]">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Buscar projeto..."
            className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="h-9 appearance-none rounded-md border border-line bg-white pl-9 pr-8 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white"
          >
            <option value="">Todos os status</option>
            <option value="PLANNED">Planejado</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="ON_HOLD">Pausado</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELED">Cancelado</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Filtrar
        </button>
        {(searchParams.q || searchParams.status) && (
          <a href="/projects" className="h-9 rounded-md border border-line px-4 text-sm font-medium text-slate-600 leading-9 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Limpar
          </a>
        )}
      </form>

      <ProjectTable projects={projects} canManage={canManage} clients={clients} managers={managers} />
    </>
  );
}
