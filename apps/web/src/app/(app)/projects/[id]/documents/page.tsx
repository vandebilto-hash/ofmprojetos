import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { FileUpload } from "@/components/ui/file-upload";
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
      <PageHeader title={`Documentos importantes | ${project.name}`} description="Documentos importantes do projeto enviados diretamente no app." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Adicionar documento" description="Envie um arquivo de ate 10 MB para o projeto." trigger="create" triggerLabel="Novo documento">
          <form action={createProjectDocumentAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Tipo<select name="type" defaultValue="Plano do projeto" required className="h-10 rounded-md border border-line px-3"><option value="Plano do projeto">Plano do projeto</option><option value="Cronograma">Cronograma</option><option value="Relatório">Relatório</option><option value="Evidência">Evidência</option><option value="Contrato">Contrato</option><option value="Outro documento">Outro documento</option></select></label>
            </div>
            <input type="hidden" name="externalUrl" value="" />
            <input type="hidden" name="embedUrl" value="" />
            <FileUpload name="downloadUrl" label="Arquivo" required />
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-medium">Versao<input name="version" placeholder="v1.0" className="h-10 rounded-md border border-line px-3" /></label>
              <label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue="Aprovado" className="h-10 rounded-md border border-line px-3"><option value="Rascunho">Rascunho</option><option value="Em revisão">Em revisão</option><option value="Aprovado">Aprovado</option><option value="Publicado">Publicado</option><option value="Obsoleto">Obsoleto</option></select></label>
              <label className="grid gap-1 text-sm font-medium">Visibilidade<select name="visibility" defaultValue="CLIENT_VISIBLE" className="h-10 rounded-md border border-line px-3"><option value="CLIENT_VISIBLE">Cliente</option><option value="PROJECT_TEAM">Equipe</option><option value="INTERNAL">Interno</option></select></label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium"><input name="clientDownloadAllowed" type="checkbox" defaultChecked /> Permitir download pelo cliente</label>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Adicionar documento</button>
          </form>
        </DialogAction>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="grid gap-2">
          {project.documents.map((document) => (
            <div key={document.id} className="rounded-md border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{document.name}</p>
                  <p className="text-slate-500">{document.type} | {document.sourceType} | {document.visibility} | {document.status}</p>
                </div>
                <div className="flex gap-2">
                  {document.embedUrl ? <a href={document.embedUrl} target="_blank" className="rounded-md border border-line px-3 py-1.5 font-semibold">Ver</a> : null}
                  {document.downloadUrl || document.externalUrl ? <a href={getDocumentHref(document)} target="_blank" className="rounded-md bg-brand-600 px-3 py-1.5 font-semibold text-white">Acessar</a> : null}
                  <DialogAction title="Editar documento" description={document.name} trigger="edit">
                    <form action={updateProjectDocumentAction} className="grid gap-3">
                      <input type="hidden" name="documentId" value={document.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Nome<input name="name" required defaultValue={document.name} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Tipo<select name="type" required defaultValue={document.type} className="h-10 rounded-md border border-line px-3"><option value="Plano do projeto">Plano do projeto</option><option value="Cronograma">Cronograma</option><option value="Relatório">Relatório</option><option value="Evidência">Evidência</option><option value="Contrato">Contrato</option><option value="Outro documento">Outro documento</option></select></label></div>
                      <input type="hidden" name="externalUrl" value={document.externalUrl ?? ""} />
                      <input type="hidden" name="embedUrl" value={document.embedUrl ?? ""} />
                      <FileUpload name="downloadUrl" label="Arquivo" defaultValue={document.downloadUrl ?? document.externalUrl ?? ""} />
                      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Versao<input name="version" defaultValue={document.version ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Status<select name="status" defaultValue={document.status ?? "Aprovado"} className="h-10 rounded-md border border-line px-3"><option value="Rascunho">Rascunho</option><option value="Em revisão">Em revisão</option><option value="Aprovado">Aprovado</option><option value="Publicado">Publicado</option><option value="Obsoleto">Obsoleto</option></select></label><label className="grid gap-1 text-sm font-medium">Visibilidade<select name="visibility" defaultValue={document.visibility} className="h-10 rounded-md border border-line px-3"><option value="CLIENT_VISIBLE">Cliente</option><option value="PROJECT_TEAM">Equipe</option><option value="INTERNAL">Interno</option></select></label></div>
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

function getDocumentHref(document: { id: string; downloadUrl?: string | null; externalUrl?: string | null }) {
  const href = document.downloadUrl ?? document.externalUrl ?? "#";
  return href.startsWith("data:") ? `/api/files/document?documentId=${document.id}` : href;
}
