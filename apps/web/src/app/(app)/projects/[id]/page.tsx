import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";
import { createPartnerAction, deletePartnerAction, updatePartnerAction, updateProjectHomeAction } from "@/server/actions/projects";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      manager: true,
      home: true,
      partners: { orderBy: { name: "asc" } },
      shareLinks: { where: { active: true }, take: 1, orderBy: { createdAt: "desc" } }
    }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.client.name} | Gestor: ${project.manager.name}${project.shareLinks[0] ? ` | Link cliente: /p/${project.shareLinks[0].token}` : ""}`}
        action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }}
      />
      <ProjectTabs projectId={project.id} />
      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <form action={updateProjectHomeAction} className="rounded-lg border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
          <input type="hidden" name="projectId" value={project.id} />
          <h2 className="text-lg font-bold text-ink">Configurar Home do projeto</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Missão do projeto
              <textarea name="mission" defaultValue={project.home?.mission ?? ""} rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" placeholder="Descreva a missão do projeto" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Sobre o cliente
              <textarea name="clientOverview" defaultValue={project.home?.clientOverview ?? ""} rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" placeholder="Informações sobre o cliente" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Proposta
              <textarea name="proposal" defaultValue={project.home?.proposal ?? ""} rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" placeholder="Proposta do projeto" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Escopo
              <textarea name="scope" defaultValue={project.home?.scope ?? ""} rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" placeholder="Escopo do projeto" />
            </label>
          </div>
          <div className="mt-5 flex justify-end border-t border-line pt-4 dark:border-slate-700">
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              Salvar Home
            </button>
          </div>
        </form>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Parceiros</h2>
            <DialogAction title="Adicionar parceiro" description="Inclua uma empresa, area ou fornecedor parceiro." trigger="create" triggerLabel="Novo">
              <form action={createPartnerAction} className="grid gap-4">
                <input type="hidden" name="projectId" value={project.id} />
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome <span className="text-red-500">*</span>
                  <input name="name" required className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="Nome do parceiro" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo
                  <select name="type" defaultValue="TECHNICAL_PARTNER" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white">
                    <option value="TECHNICAL_PARTNER">Parceiro Técnico</option>
                    <option value="CLIENT">Cliente</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Descrição
                  <textarea name="description" rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" placeholder="Descrição do parceiro" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Website
                  <input name="website" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" placeholder="https://exemplo.com" />
                </label>
                <ImageUpload name="logoUrl" label="Logo do parceiro" />
                <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                  <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                    Adicionar
                  </button>
                </div>
              </form>
            </DialogAction>
          </div>
          <div className="mt-4 grid gap-2">
            {project.partners.map((partner) => (
              <div key={partner.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-3 text-sm">
                <div className="flex items-start gap-3">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="h-10 w-10 shrink-0 rounded-md object-contain" />
                  ) : null}
                  <div>
                    <div className="flex items-center gap-2">
                      <strong>{partner.name}</strong>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${partner.type === "CLIENT" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                        {partner.type === "CLIENT" ? "Cliente" : "Parceiro Técnico"}
                      </span>
                    </div>
                    <p className="text-slate-500">{partner.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <DialogAction title="Editar parceiro" description={partner.name} trigger="edit">
                    <form action={updatePartnerAction} className="grid gap-4">
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nome <span className="text-red-500">*</span>
                        <input name="name" required defaultValue={partner.name} className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tipo
                        <select name="type" defaultValue={partner.type} className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white">
                          <option value="TECHNICAL_PARTNER">Parceiro Técnico</option>
                          <option value="CLIENT">Cliente</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Descrição
                        <textarea name="description" defaultValue={partner.description ?? ""} rows={3} className="min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Website
                        <input name="website" defaultValue={partner.website ?? ""} className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
                      </label>
                      <ImageUpload name="logoUrl" defaultValue={partner.logoUrl} label="Logo do parceiro" />
                      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
                        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                          Salvar
                        </button>
                      </div>
                    </form>
                  </DialogAction>
                  <DialogAction title="Excluir parceiro" description={`Deseja realmente excluir "${partner.name}"?`} trigger="delete">
                    <form action={deletePartnerAction} className="flex justify-end">
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            ))}
            {!project.partners.length ? <p className="text-sm text-slate-500">Nenhum parceiro cadastrado.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
