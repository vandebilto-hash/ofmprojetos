import { notFound } from "next/navigation";
import { DialogAction } from "@/components/ui/dialog-action";
import { FileUpload } from "@/components/ui/file-upload";
import { MultiFileUpload } from "@/components/ui/multi-file-upload";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";
import { getProjectPeople } from "@/lib/project-people";
import { deleteImportantEmailAction, upsertImportantEmailAction } from "@/server/actions/projects";

const visibilityLabel: Record<string, string> = {
  INTERNAL: "Interno OFM",
  PROJECT_TEAM: "Equipe do projeto",
  CLIENT_VISIBLE: "Público / cliente"
};

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function ProjectEmailsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      importantEmails: {
        where: { parentId: null },
        include: {
          attachments: { orderBy: { createdAt: "asc" } },
          replies: { include: { attachments: { orderBy: { createdAt: "asc" } } }, orderBy: { date: "asc" } }
        },
        orderBy: { date: "desc" }
      },
      manager: true,
      stakeholders: { orderBy: { name: "asc" } },
      allocations: { include: { user: true } }
    }
  });
  if (!project) notFound();
  const people = getProjectPeople(project);

  return (
    <>
      <PageHeader title={`E-mails importantes | ${project.name}`} description="Cadastro de comunicacoes formais que aparecem no portal do cliente." action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }} />
      <ProjectTabs projectId={project.id} />
      <div className="mb-4 flex justify-end">
        <DialogAction title="Cadastrar e-mail" description="Inclua uma comunicacao relevante do projeto." trigger="create" triggerLabel="Novo e-mail">
          <EmailForm projectId={project.id} people={people} />
        </DialogAction>
      </div>
      <section className="grid gap-3">
        {project.importantEmails.map((email) => (
          <article key={email.id} className="rounded-lg border border-line bg-white p-4 text-sm shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">{formatDate(email.date)} | {email.category} | {email.status} | {visibilityLabel[email.visibility] ?? "Equipe do projeto"}</p>
                <h2 className="mt-1 font-bold text-ink">{email.subject}</h2>
                <p className="mt-1 text-slate-600">{email.summary}</p>
                <p className="mt-2 text-xs text-slate-500">Origem: {email.origin ?? "-"} | Envolvidos: {email.involved ?? "-"}</p>
                <EmailAttachments email={email} />
              </div>
              <div className="flex gap-2">
                <DialogAction title="Adicionar resposta" description={email.subject} trigger="create" triggerLabel="Responder">
                  <EmailForm projectId={project.id} parentId={email.id} people={people} defaultSubject={`RE: ${email.subject}`} />
                </DialogAction>
                <DialogAction title="Editar e-mail" description={email.subject} trigger="edit">
                  <EmailForm projectId={project.id} email={email} people={people} />
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
            {email.replies.length ? (
              <div className="mt-4 grid gap-3 border-l-2 border-brand-100 pl-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thread de respostas</p>
                {email.replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg border border-line bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500">{formatDate(reply.date)} | {reply.category} | {reply.status} | {visibilityLabel[reply.visibility] ?? "Equipe do projeto"}</p>
                        <h3 className="mt-1 font-bold text-ink">{reply.subject}</h3>
                        <p className="mt-1 text-slate-600">{reply.summary}</p>
                        <p className="mt-2 text-xs text-slate-500">Origem: {reply.origin ?? "-"} | Envolvidos: {reply.involved ?? "-"}</p>
                        <EmailAttachments email={reply} />
                      </div>
                      <div className="flex gap-2">
                        <DialogAction title="Editar resposta" description={reply.subject} trigger="edit">
                          <EmailForm projectId={project.id} parentId={email.id} email={reply} people={people} />
                        </DialogAction>
                        <DialogAction title="Excluir resposta" description={`Deseja realmente excluir "${reply.subject}"?`} trigger="delete">
                          <form action={deleteImportantEmailAction} className="flex justify-end">
                            <input type="hidden" name="emailId" value={reply.id} />
                            <input type="hidden" name="projectId" value={project.id} />
                            <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                          </form>
                        </DialogAction>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {!project.importantEmails.length ? <p className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Nenhum e-mail cadastrado.</p> : null}
      </section>
    </>
  );
}

function EmailAttachments({ email }: { email: any }) {
  const attachments = email.attachments ?? [];
  const links = [
    ...attachments.map((attachment: any) => ({ name: attachment.name, href: attachment.fileUrl?.startsWith("data:") ? `/api/files/email?attachmentId=${attachment.id}` : attachment.fileUrl })),
    ...(email.attachmentUrl ? [{ name: "Arquivo do e-mail", href: email.attachmentUrl.startsWith("data:") ? `/api/files/email?emailId=${email.id}` : email.attachmentUrl }] : [])
  ];

  if (!links.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((attachment, index) => (
        <a key={`${attachment.name}-${index}`} href={attachment.href} target="_blank" className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100">
          {attachment.name}
        </a>
      ))}
    </div>
  );
}

function EmailForm({ projectId, parentId, email, people, defaultSubject }: { projectId: string; parentId?: string; email?: any; people: string[]; defaultSubject?: string }) {
  const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
  const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
  const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  return (
    <form action={upsertImportantEmailAction} className="grid gap-4">
      {email ? <input type="hidden" name="emailId" value={email.id} /> : null}
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="parentId" value={parentId ?? email?.parentId ?? ""} />

      <div>
        <p className={sectionTitle}>Identificação</p>
        <div className="mt-2 grid gap-3">
          <label className={labelClass}>
            Assunto <span className="text-red-500">*</span>
            <input name="subject" required defaultValue={email?.subject ?? defaultSubject ?? ""} className={inputClass} placeholder="Assunto do e-mail" />
          </label>
          <label className={labelClass}>
            Resumo <span className="text-red-500">*</span>
            <textarea name="summary" required defaultValue={email?.summary ?? ""} rows={3} className={textareaClass} placeholder="Resumo do conteúdo" />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Pessoas</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <PeopleMultiSelect name="origin" label="Origem" people={people} defaultValue={email?.origin ?? ""} />
          <PeopleMultiSelect name="involved" label="Envolvidos" people={people} defaultValue={email?.involved ?? ""} />
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Classificação</p>
        <div className="mt-2 grid grid-cols-4 gap-3">
          <label className={labelClass}>
            Categoria <span className="text-red-500">*</span>
            <select name="category" defaultValue={email?.category ?? "E-mail Formal"} className={selectClass} required>
              <option value="E-mail Formal">E-mail formal</option>
              <option value="Solicitação">Solicitação</option>
              <option value="Decisão">Decisão</option>
              <option value="Pendência">Pendência</option>
              <option value="Aprovação">Aprovação</option>
              <option value="Alinhamento">Alinhamento</option>
            </select>
          </label>
          <label className={labelClass}>
            Status <span className="text-red-500">*</span>
            <select name="status" defaultValue={email?.status ?? "Solucionado"} className={selectClass} required>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Aguardando retorno">Aguardando retorno</option>
              <option value="Solucionado">Solucionado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>
          <label className={labelClass}>
            Data <span className="text-red-500">*</span>
            <input name="date" type="date" required defaultValue={inputDate(email?.date ?? null)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Visibilidade <span className="text-red-500">*</span>
            <select name="visibility" defaultValue={email?.visibility ?? "PROJECT_TEAM"} className={selectClass} required>
              <option value="INTERNAL">Interno OFM</option>
              <option value="PROJECT_TEAM">Equipe do projeto</option>
              <option value="CLIENT_VISIBLE">Público / cliente</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Anexos</p>
        <div className="mt-2 grid gap-3">
          <FileUpload name="attachmentUrl" label="Arquivo do e-mail" defaultValue={email?.attachmentUrl ?? ""} />
          <MultiFileUpload name="attachments" label="Arquivos relacionados" defaultValue={(email?.attachments ?? []).map((attachment: any) => ({ name: attachment.name, fileUrl: attachment.fileUrl }))} />
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          Salvar
        </button>
      </div>
    </form>
  );
}
