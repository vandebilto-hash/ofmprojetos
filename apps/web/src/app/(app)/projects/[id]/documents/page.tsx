import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { prisma } from "@/lib/prisma/client";
import { createProjectDocumentAction, deleteProjectDocumentAction, updateProjectDocumentAction } from "@/server/actions/projects";

export default async function ProjectDocumentsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader title={`Planos | ${project.name}`} description="Planos do projeto cadastrados como links, embeds e downloads do Google Drive." />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Adicionar plano" description="Cadastre um documento do Google Drive para o projeto." trigger="create" triggerLabel="Novo documento">
          <form action={createProjectDocumentAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Tipo<input name="type" defaultValue="Plano do projeto" required className="h-10 rounded-md border border-line px-3" /></label>
            </div>
            <label className="grid gap-1 text-sm font-medium">Link Google Drive<input name="externalUrl" type="url" placeholder="https://drive.google.com/..." className="h-10 rounded-md border border-line px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">Link embed/visualizacao<input name="embedUrl" type="url" className="h-10 rounded-md border border-line px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">Link download<input name="downloadUrl" type="url" className="h-10 rounded-md border border-line px-3" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Versao<input name="version" placeholder="v1.0" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Status<input name="status" defaultValue="Aprovado" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Visibilidade<select name="visibility" defaultValue="CLIENT_VISIBLE" className="h-10 rounded-md border border-line px-3"><option value="CLIENT_VISIBLE">Cliente</option><option value="PROJECT_TEAM">Equipe</option><option value="INTERNAL">Interno</option></select></label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium"><input name="clientDownloadAllowed" type="checkbox" defaultChecked /> Permitir download pelo cliente</label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Adicionar documento</button>
          </form>
        </DialogAction>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="text-sm text-slate-600">No MVP os documentos ficam no Google Drive. O portal armazena os metadados, links de visualizacao e links de download.</p>
        <div className="mt-4 grid gap-2">
          {project.documents.map((document) => (
            <div key={document.id} className="rounded-md border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{document.name}</p>
                  <p className="text-slate-500">{document.type} | {document.sourceType} | {document.visibility} | {document.status}</p>
                </div>
                <div className="flex gap-2">
                  {document.embedUrl ? <a href={document.embedUrl} target="_blank" className="rounded-md border border-line px-3 py-1.5 font-semibold">Ver</a> : null}
                  {document.downloadUrl || document.externalUrl ? <a href={document.downloadUrl ?? document.externalUrl ?? "#"} target="_blank" className="rounded-md bg-brand-600 px-3 py-1.5 font-semibold text-white">Baixar</a> : null}
                  <DialogAction title="Editar documento" description={document.name} trigger="edit">
                    <form action={updateProjectDocumentAction} className="grid gap-3">
                      <input type="hidden" name="documentId" value={document.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Nome<input name="name" required defaultValue={document.name} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Tipo<input name="type" required defaultValue={document.type} className="h-10 rounded-md border border-line px-3" /></label></div>
                      <label className="grid gap-1 text-sm font-medium">Link Google Drive<input name="externalUrl" type="url" defaultValue={document.externalUrl ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
                      <label className="grid gap-1 text-sm font-medium">Link embed/visualizacao<input name="embedUrl" type="url" defaultValue={document.embedUrl ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
                      <label className="grid gap-1 text-sm font-medium">Link download<input name="downloadUrl" type="url" defaultValue={document.downloadUrl ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
                      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Versao<input name="version" defaultValue={document.version ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Status<input name="status" defaultValue={document.status} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Visibilidade<select name="visibility" defaultValue={document.visibility} className="h-10 rounded-md border border-line px-3"><option value="CLIENT_VISIBLE">Cliente</option><option value="PROJECT_TEAM">Equipe</option><option value="INTERNAL">Interno</option></select></label></div>
                      <label className="flex items-center gap-2 text-sm font-medium"><input name="clientDownloadAllowed" type="checkbox" defaultChecked={document.clientDownloadAllowed} /> Permitir download pelo cliente</label>
                      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
                    </form>
                  </DialogAction>
                  <DialogAction title="Excluir documento" description={`Deseja realmente excluir "${document.name}"?`} trigger="delete">
                    <form action={deleteProjectDocumentAction} className="flex justify-end">
                      <input type="hidden" name="documentId" value={document.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            </div>
          ))}
          {!project.documents.length ? <p className="text-sm text-slate-500">Nenhum documento enviado.</p> : null}
        </div>
      </div>
    </>
  );
}
