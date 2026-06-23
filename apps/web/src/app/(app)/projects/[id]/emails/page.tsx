import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { deleteImportantEmailAction, upsertImportantEmailAction } from "@/server/actions/projects";

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProjectEmailsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { importantEmails: { orderBy: { date: "desc" } } }
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader title={`E-mails importantes | ${project.name}`} description="Cadastro de comunicacoes formais que aparecem no portal do cliente." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar e-mail" description="Inclua uma comunicacao relevante do projeto." trigger="create" triggerLabel="Novo e-mail">
          <EmailForm projectId={project.id} />
        </DialogAction>
      </div>
      <section className="grid gap-3">
        {project.importantEmails.map((email) => (
          <article key={email.id} className="rounded-lg border border-line bg-white p-4 text-sm shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">{formatDate(email.date)} | {email.category} | {email.status}</p>
                <h2 className="mt-1 font-bold text-ink">{email.subject}</h2>
                <p className="mt-1 text-slate-600">{email.summary}</p>
                <p className="mt-2 text-xs text-slate-500">Origem: {email.origin ?? "-"} | Envolvidos: {email.involved ?? "-"}</p>
              </div>
              <div className="flex gap-2">
                <DialogAction title="Editar e-mail" description={email.subject} trigger="edit">
                  <EmailForm projectId={project.id} email={email} />
                </DialogAction>
                <DialogAction title="Excluir e-mail" description={`Deseja realmente excluir "${email.subject}"?`} trigger="delete">
                  <form action={deleteImportantEmailAction} className="flex justify-end">
                    <input type="hidden" name="emailId" value={email.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                  </form>
                </DialogAction>
              </div>
            </div>
          </article>
        ))}
        {!project.importantEmails.length ? <p className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhum e-mail cadastrado.</p> : null}
      </section>
    </>
  );
}

function EmailForm({ projectId, email }: { projectId: string; email?: any }) {
  return (
    <form action={upsertImportantEmailAction} className="grid gap-3">
      {email ? <input type="hidden" name="emailId" value={email.id} /> : null}
      <input type="hidden" name="projectId" value={projectId} />
      <label className="grid gap-1 text-sm font-medium">Assunto<input name="subject" required defaultValue={email?.subject ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Resumo<textarea name="summary" defaultValue={email?.summary ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Origem<input name="origin" defaultValue={email?.origin ?? ""} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Envolvidos<input name="involved" defaultValue={email?.involved ?? ""} className="h-10 rounded-md border border-line px-3" /></label></div>
      <div className="grid grid-cols-3 gap-3"><label className="grid gap-1 text-sm font-medium">Categoria<input name="category" defaultValue={email?.category ?? "E-mail Formal"} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Status<input name="status" defaultValue={email?.status ?? "Solucionado"} className="h-10 rounded-md border border-line px-3" /></label><label className="grid gap-1 text-sm font-medium">Data<input name="date" type="date" required defaultValue={inputDate(email?.date ?? null)} className="h-10 rounded-md border border-line px-3" /></label></div>
      <label className="grid gap-1 text-sm font-medium">Anexo/link<input name="attachmentUrl" type="url" defaultValue={email?.attachmentUrl ?? ""} className="h-10 rounded-md border border-line px-3" /></label>
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar</button>
    </form>
  );
}
