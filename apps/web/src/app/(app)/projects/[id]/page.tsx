import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { ProjectPortal } from "@/features/projects/project-portal";
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
      stakeholders: { orderBy: { name: "asc" } },
      milestones: { orderBy: { plannedDate: "asc" } },
      documents: { where: { visibility: "CLIENT_VISIBLE" }, orderBy: { createdAt: "desc" } },
      todos: { orderBy: [{ priority: "desc" }, { dueDate: "asc" }] },
      risks: { orderBy: [{ classification: "desc" }, { registeredAt: "desc" }] },
      shareLinks: { where: { active: true }, take: 1, orderBy: { createdAt: "desc" } },
      tasks: {
        include: { owner: true },
        orderBy: { plannedStart: "asc" }
      },
      blockers: { orderBy: { openedAt: "desc" } }
    }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.client.name} | Gestor: ${project.manager.name}${project.shareLinks[0] ? ` | Link cliente: /p/${project.shareLinks[0].token}` : ""}`}
      />
      <ProjectTabs projectId={project.id} />
      <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <form action={updateProjectHomeAction} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <input type="hidden" name="projectId" value={project.id} />
          <h2 className="text-lg font-bold text-ink">Configurar Home do projeto</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">Missao do projeto<textarea name="mission" defaultValue={project.home?.mission ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Sobre o cliente<textarea name="clientOverview" defaultValue={project.home?.clientOverview ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Proposta<textarea name="proposal" defaultValue={project.home?.proposal ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Escopo<textarea name="scope" defaultValue={project.home?.scope ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
          </div>
          <button className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar Home</button>
        </form>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Parceiros</h2>
            <DialogAction title="Adicionar parceiro" description="Inclua uma empresa, area ou fornecedor parceiro." trigger="create" triggerLabel="Novo">
              <form action={createPartnerAction} className="grid gap-3">
                <input type="hidden" name="projectId" value={project.id} />
                <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
                <label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue="TECHNICAL_PARTNER" className="h-10 rounded-md border border-line px-3"><option value="TECHNICAL_PARTNER">Parceiro Técnico</option><option value="CLIENT">Cliente</option></select></label>
                <label className="grid gap-1 text-sm font-medium">Descricao<textarea name="description" rows={3} className="rounded-md border border-line px-3 py-2" /></label>
                <label className="grid gap-1 text-sm font-medium">Website<input name="website" className="h-10 rounded-md border border-line px-3" /></label>
                <ImageUpload name="logoUrl" label="Logo do parceiro" />
                <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Adicionar</button>
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
                    <form action={updatePartnerAction} className="grid gap-3">
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required defaultValue={partner.name} className="h-10 rounded-md border border-line px-3" /></label>
                      <label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue={partner.type} className="h-10 rounded-md border border-line px-3"><option value="TECHNICAL_PARTNER">Parceiro Técnico</option><option value="CLIENT">Cliente</option></select></label>
                      <label className="grid gap-1 text-sm font-medium">Descricao<textarea name="description" defaultValue={partner.description ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
                      <label className="grid gap-1 text-sm font-medium">Website<input name="website" defaultValue={partner.website ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
                      <ImageUpload name="logoUrl" defaultValue={partner.logoUrl} label="Logo do parceiro" />
                      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
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
      <ProjectPortal project={project} />
    </>
  );
}
