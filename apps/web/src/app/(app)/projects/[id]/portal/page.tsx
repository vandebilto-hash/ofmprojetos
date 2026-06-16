import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { portalModules } from "@/features/portal/modules";
import { GenerateLinkButton } from "@/features/projects/generate-link-button";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";
import { updateProjectPortalModulesAction, updateProjectPortalEmailsAction } from "@/server/actions/projects";

export default async function ProjectPortalSettingsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      shareLinks: { orderBy: { createdAt: "desc" } },
      moduleSettings: { orderBy: { sortOrder: "asc" } }
    }
  });
  if (!project) notFound();

  const settingsByKey = new Map(project.moduleSettings.map((setting) => [setting.key, setting]));
  const activeLink = project.shareLinks.find((link) => link.active);

  return (
    <>
      <PageHeader title={`Portal cliente | ${project.name}`} description="Configure individualmente quais paginas o cliente acessa pelo link publico." />
      <ProjectTabs projectId={project.id} />

      <section className="mb-5 rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold text-slate-500">Link publico do cliente</p>
        {activeLink ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-slate-100 px-3 py-2 text-sm">/p/{activeLink.token}</code>
            <Link href={`/p/${activeLink.token}`} target="_blank" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Abrir portal
            </Link>
          </div>
        ) : (
          <div>
            <p className="mt-2 text-sm text-red-600">Este projeto ainda nao possui link publico ativo.</p>
            <GenerateLinkButton projectId={project.id} />
          </div>
        )}
      </section>

      {activeLink && (
        <form action={updateProjectPortalEmailsAction} className="mb-5 rounded-lg border border-line bg-white p-5 shadow-soft">
          <input type="hidden" name="shareLinkId" value={activeLink.id} />
          <input type="hidden" name="projectId" value={project.id} />
          <div className="mb-3">
            <h2 className="text-lg font-bold text-ink">Restricao de acesso por e-mail</h2>
            <p className="mt-1 text-sm text-slate-600">
              Se preenchido, apenas os e-mails listados poderao acessar o portal. Deixe vazio para permitir acesso a qualquer pessoa com o link.
            </p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            E-mails autorizados (separados por virgula)
            <textarea
              name="allowedEmails"
              defaultValue={activeLink.allowedEmails ?? ""}
              rows={3}
              placeholder="cliente@empresa.com, outro@email.com"
              className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <button className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Salvar e-mails autorizados
          </button>
        </form>
      )}

      <form action={updateProjectPortalModulesAction} className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <input type="hidden" name="projectId" value={project.id} />
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink">Modulos do portal</h2>
          <p className="mt-1 text-sm text-slate-600">Desabilitar um modulo remove sua pagina da navegacao publica e bloqueia acesso direto pela URL.</p>
        </div>

        <div className="grid gap-3">
          {portalModules.map((module) => {
            const setting = settingsByKey.get(module.key);
            return (
              <div key={module.key} className="grid gap-3 rounded-lg border border-line p-4 md:grid-cols-[1fr_180px_180px] md:items-center">
                <div>
                  <label className="text-sm font-semibold text-slate-500">Nome exibido</label>
                  <input
                    name={`${module.key}:label`}
                    defaultValue={setting?.label ?? module.label}
                    className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name={`${module.key}:enabled`} type="checkbox" defaultChecked={setting?.enabled ?? true} className="h-4 w-4" />
                  Modulo ativo
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name={`${module.key}:visibleToClient`} type="checkbox" defaultChecked={setting?.visibleToClient ?? true} className="h-4 w-4" />
                  Visivel ao cliente
                </label>
              </div>
            );
          })}
        </div>

        <button className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Salvar configuracao do portal
        </button>
      </form>
    </>
  );
}
