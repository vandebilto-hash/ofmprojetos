import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma/client";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    include: { uploadedBy: true, project: true, client: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <PageHeader title="Documentos" description="Planos e documentos vinculados aos projetos, incluindo links do Google Drive." />
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        {documents.map((document) => (
          <div key={document.id} className="border-b border-line py-3 text-sm last:border-b-0">
            <strong>{document.name}</strong> | {document.type} | {document.sourceType} | {document.visibility} | enviado por {document.uploadedBy.name}
          </div>
        ))}
        {!documents.length ? <p className="text-sm text-slate-500">Nenhum documento cadastrado.</p> : null}
      </div>
    </>
  );
}
