import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { getCompanyBadgeClass, getCompanyLabel } from "@/lib/company-colors";
import { prisma } from "@/lib/prisma/client";
import { createStakeholderAction, deleteStakeholderAction, updateStakeholderAction } from "@/server/actions/projects";

const stakeholderTypeLabel: Record<string, string> = {
  INTERNAL: "Interno",
  CLIENT: "Cliente",
  PARTNER: "Parceiro",
  SUPPLIER: "Fornecedor",
  SPONSOR: "Patrocinador"
};

const levelLabel: Record<string, string> = {
  LOW: "Baixa",
  HIGH: "Alta"
};

export default async function ProjectGovernancePage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { stakeholders: { orderBy: { name: "asc" } } }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader title={`Governança | ${project.name}`} description="Partes interessadas, mapa de influência/interesse e indicadores." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar parte interessada" description="Adicione uma nova parte interessada ao mapa de governança." trigger="create" triggerLabel="Nova parte interessada">
          <form action={createStakeholderAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Empresa/Área<input name="company" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Cargo<input name="jobTitle" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Papel no projeto<input name="projectRole" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue="CLIENT" className="h-10 rounded-md border border-line px-3"><option value="INTERNAL">Interno</option><option value="CLIENT">Cliente</option><option value="PARTNER">Parceiro</option><option value="SUPPLIER">Fornecedor</option><option value="SPONSOR">Patrocinador</option></select></label>
              <label className="grid gap-1 text-sm font-medium">Influência<select name="influence" defaultValue="LOW" className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixa</option><option value="HIGH">Alta</option></select></label>
              <label className="grid gap-1 text-sm font-medium">Interesse<select name="interest" defaultValue="LOW" className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixo</option><option value="HIGH">Alto</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">E-mail<input name="email" type="email" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Telefone<input name="phone" className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Classificação<select name="classification" defaultValue="Manter informado" className="h-10 rounded-md border border-line px-3"><option value="Gerenciar de perto">Gerenciar de perto</option><option value="Manter satisfeito">Manter satisfeito</option><option value="Manter informado">Manter informado</option><option value="Monitorar">Monitorar</option></select></label>
            <label className="grid gap-1 text-sm font-medium">Observações<textarea name="notes" rows={3} className="rounded-md border border-line px-3 py-2" /></label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar</button>
          </form>
        </DialogAction>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Partes interessadas</p><p className="mt-2 text-2xl font-bold">{project.stakeholders.length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Alta influência</p><p className="mt-2 text-2xl font-bold">{project.stakeholders.filter((item) => item.influence === "HIGH").length}</p></div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Ativos</p><p className="mt-2 text-2xl font-bold">{project.stakeholders.filter((item) => item.active).length}</p></div>
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold">Mapa de partes interessadas</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[["HIGH", "HIGH", "Gerenciar de perto"], ["HIGH", "LOW", "Manter satisfeito"], ["LOW", "HIGH", "Manter informado"], ["LOW", "LOW", "Monitorar"]].map(([influence, interest, label]) => (
              <div key={`${influence}-${interest}`} className="min-h-32 rounded-lg border border-line p-3">
                <p className="font-semibold text-ink">{label}</p>
                <p className="mt-1 text-xs text-slate-500">Influência {levelLabel[influence]} | Interesse {levelLabel[interest]}</p>
                <div className="mt-3 grid gap-2">
                  {project.stakeholders.filter((item) => item.influence === influence && item.interest === interest).map((item) => (
                    <span key={item.id} className="flex flex-wrap items-center gap-1.5 rounded bg-slate-100 px-2 py-1">
                      <span>{item.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCompanyBadgeClass(item.company)}`}>{getCompanyLabel(item.company)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold">Cadastro de partes interessadas</h2>
          <div className="mt-4 grid gap-2">
            {project.stakeholders.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-3 text-sm">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span>{item.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCompanyBadgeClass(item.company)}`}>{getCompanyLabel(item.company)}</span>
                  </p>
                  <p className="text-slate-500">{item.jobTitle ?? item.projectRole ?? "-"} | {stakeholderTypeLabel[item.type]}</p>
                </div>
                <div className="flex gap-2">
                  <DialogAction title="Editar parte interessada" description={item.name} trigger="edit">
                    <form action={updateStakeholderAction} className="grid gap-3">
                      <input type="hidden" name="stakeholderId" value={item.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Nome<input name="name" required defaultValue={item.name} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Empresa/Área<input name="company" defaultValue={item.company ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Cargo<input name="jobTitle" defaultValue={item.jobTitle ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Papel no projeto<input name="projectRole" defaultValue={item.projectRole ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue={item.type} className="h-10 rounded-md border border-line px-3"><option value="INTERNAL">Interno</option><option value="CLIENT">Cliente</option><option value="PARTNER">Parceiro</option><option value="SUPPLIER">Fornecedor</option><option value="SPONSOR">Patrocinador</option></select></label><label className="grid gap-1 text-sm font-medium">Influência<select name="influence" defaultValue={item.influence} className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixa</option><option value="HIGH">Alta</option></select></label><label className="grid gap-1 text-sm font-medium">Interesse<select name="interest" defaultValue={item.interest} className="h-10 rounded-md border border-line px-3"><option value="LOW">Baixo</option><option value="HIGH">Alto</option></select></label></div>
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">E-mail<input name="email" type="email" defaultValue={item.email ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Telefone<input name="phone" defaultValue={item.phone ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <label className="grid gap-1 text-sm font-medium">Classificação<select name="classification" defaultValue={item.classification ?? "Manter informado"} className="h-10 rounded-md border border-line px-3"><option value="Gerenciar de perto">Gerenciar de perto</option><option value="Manter satisfeito">Manter satisfeito</option><option value="Manter informado">Manter informado</option><option value="Monitorar">Monitorar</option></select></label>
                      <label className="grid gap-1 text-sm font-medium">Observações<textarea name="notes" defaultValue={item.notes ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
                      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
                    </form>
                  </DialogAction>
                  <DialogAction title="Excluir parte interessada" description={`Deseja realmente excluir "${item.name}"?`} trigger="delete">
                    <form action={deleteStakeholderAction} className="flex justify-end">
                      <input type="hidden" name="stakeholderId" value={item.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
