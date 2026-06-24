"use client";

import { useState } from "react";
import { DialogAction } from "@/components/ui/dialog-action";
import { FileUpload } from "@/components/ui/file-upload";
import { MultiFileUpload } from "@/components/ui/multi-file-upload";
import { PeopleMultiSelect } from "@/components/ui/people-multi-select";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate } from "@/lib/format";
import {
  createProjectDocumentAction,
  deleteProjectDocumentAction,
  deleteImportantEmailAction,
  deleteMeetingMinuteAction,
  updateProjectDocumentAction,
  upsertImportantEmailAction,
  upsertMeetingMinuteAction,
} from "@/server/actions/projects";

function inputDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

const tabKeys = ["emails", "atas", "planos", "documentos"] as const;
type TabKey = (typeof tabKeys)[number];

const tabLabels: Record<TabKey, string> = {
  emails: "E-mails",
  atas: "Atas",
  planos: "Planos",
  documentos: "Documentos importantes",
};

export function UnifiedDocumentsClient({
  project,
  people,
}: {
  project: any;
  people: string[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("emails");

  return (
    <>
      <PageHeader
        title={`Documentos | ${project.name}`}
        description="Gerencie e-mails, atas, planos e documentos importantes do projeto."
        action={{ href: `/projects/${project.id}/dashboard`, label: "Painel" }}
      />
      <ProjectTabs projectId={project.id} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
              activeTab === key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-white text-slate-700 hover:bg-brand-50"
            }`}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {activeTab === "emails" && (
        <EmailsTab project={project} people={people} />
      )}
      {activeTab === "atas" && (
        <AtasTab project={project} people={people} />
      )}
      {activeTab === "planos" && <PlanosTab project={project} />}
      {activeTab === "documentos" && <DocumentosTab project={project} />}
    </>
  );
}

// ─── Emails Tab ─────────────────────────────────────────────────────────────

function EmailsTab({ project, people }: { project: any; people: string[] }) {
  const emails = project.importantEmails ?? [];
  return (
    <>
      <div className="mb-4 flex justify-end">
        <DialogAction
          title="Cadastrar e-mail"
          description="Inclua uma comunicacao relevante do projeto."
          trigger="create"
          triggerLabel="Novo e-mail"
        >
          <EmailForm projectId={project.id} people={people} />
        </DialogAction>
      </div>
      <section className="grid gap-3">
        {emails.map((email: any) => (
          <article
            key={email.id}
            className="rounded-lg border border-line bg-white p-4 text-sm shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {formatDate(email.date)} | {email.category} | {email.status}
                </p>
                <h2 className="mt-1 font-bold text-ink">{email.subject}</h2>
                <p className="mt-1 text-slate-600">{email.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Origem: {email.origin ?? "-"} | Envolvidos:{" "}
                  {email.involved ?? "-"}
                </p>
                <EmailAttachments email={email} />
              </div>
              <div className="flex gap-2">
                <DialogAction
                  title="Adicionar resposta"
                  description={email.subject}
                  trigger="create"
                  triggerLabel="Responder"
                >
                  <EmailForm
                    projectId={project.id}
                    parentId={email.id}
                    people={people}
                    defaultSubject={`RE: ${email.subject}`}
                  />
                </DialogAction>
                <DialogAction
                  title="Editar e-mail"
                  description={email.subject}
                  trigger="edit"
                >
                  <EmailForm
                    projectId={project.id}
                    email={email}
                    people={people}
                  />
                </DialogAction>
                <DialogAction
                  title="Excluir e-mail"
                  description={`Deseja realmente excluir "${email.subject}"?`}
                  trigger="delete"
                >
                  <form
                    action={deleteImportantEmailAction}
                    className="flex justify-end"
                  >
                    <input type="hidden" name="emailId" value={email.id} />
                    <input
                      type="hidden"
                      name="projectId"
                      value={project.id}
                    />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                      Sim, excluir
                    </button>
                  </form>
                </DialogAction>
              </div>
            </div>
            {email.replies?.length ? (
              <div className="mt-4 grid gap-3 border-l-2 border-brand-100 pl-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Thread de respostas
                </p>
                {email.replies.map((reply: any) => (
                  <div
                    key={reply.id}
                    className="rounded-lg border border-line bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          {formatDate(reply.date)} | {reply.category} |{" "}
                          {reply.status}
                        </p>
                        <h3 className="mt-1 font-bold text-ink">
                          {reply.subject}
                        </h3>
                        <p className="mt-1 text-slate-600">{reply.summary}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Origem: {reply.origin ?? "-"} | Envolvidos:{" "}
                          {reply.involved ?? "-"}
                        </p>
                        <EmailAttachments email={reply} />
                      </div>
                      <div className="flex gap-2">
                        <DialogAction
                          title="Editar resposta"
                          description={reply.subject}
                          trigger="edit"
                        >
                          <EmailForm
                            projectId={project.id}
                            parentId={email.id}
                            email={reply}
                            people={people}
                          />
                        </DialogAction>
                        <DialogAction
                          title="Excluir resposta"
                          description={`Deseja realmente excluir "${reply.subject}"?`}
                          trigger="delete"
                        >
                          <form
                            action={deleteImportantEmailAction}
                            className="flex justify-end"
                          >
                            <input
                              type="hidden"
                              name="emailId"
                              value={reply.id}
                            />
                            <input
                              type="hidden"
                              name="projectId"
                              value={project.id}
                            />
                            <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                              Sim, excluir
                            </button>
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
        {!emails.length ? (
          <p className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">
            Nenhum e-mail cadastrado.
          </p>
        ) : null}
      </section>
    </>
  );
}

function EmailAttachments({ email }: { email: any }) {
  const attachments = email.attachments ?? [];
  const links = [
    ...attachments.map((attachment: any) => ({
      name: attachment.name,
      href: attachment.fileUrl?.startsWith("data:")
        ? `/api/files/email?attachmentId=${attachment.id}`
        : attachment.fileUrl,
    })),
    ...(email.attachmentUrl
      ? [
          {
            name: "Arquivo do e-mail",
            href: email.attachmentUrl.startsWith("data:")
              ? `/api/files/email?emailId=${email.id}`
              : email.attachmentUrl,
          },
        ]
      : []),
  ];

  if (!links.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((attachment, index) => (
        <a
          key={`${attachment.name}-${index}`}
          href={attachment.href}
          target="_blank"
          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100"
        >
          {attachment.name}
        </a>
      ))}
    </div>
  );
}

function EmailForm({
  projectId,
  parentId,
  email,
  people,
  defaultSubject,
}: {
  projectId: string;
  parentId?: string;
  email?: any;
  people: string[];
  defaultSubject?: string;
}) {
  return (
    <form action={upsertImportantEmailAction} className="grid gap-3">
      {email ? (
        <input type="hidden" name="emailId" value={email.id} />
      ) : null}
      <input type="hidden" name="projectId" value={projectId} />
      <input
        type="hidden"
        name="parentId"
        value={parentId ?? email?.parentId ?? ""}
      />
      <label className="grid gap-1 text-sm font-medium">
        Assunto
        <input
          name="subject"
          required
          defaultValue={email?.subject ?? defaultSubject ?? ""}
          className="h-10 rounded-md border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Resumo
        <textarea
          name="summary"
          defaultValue={email?.summary ?? ""}
          rows={3}
          className="rounded-md border border-line px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <PeopleMultiSelect
          name="origin"
          label="Origem"
          people={people}
          defaultValue={email?.origin ?? ""}
        />
        <PeopleMultiSelect
          name="involved"
          label="Envolvidos"
          people={people}
          defaultValue={email?.involved ?? ""}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Categoria
          <select
            name="category"
            defaultValue={email?.category ?? "E-mail Formal"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="E-mail Formal">E-mail formal</option>
            <option value="Solicitação">Solicitacao</option>
            <option value="Decisão">Decisao</option>
            <option value="Pendência">Pendencia</option>
            <option value="Aprovação">Aprovacao</option>
            <option value="Alinhamento">Alinhamento</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={email?.status ?? "Solucionado"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando retorno">Aguardando retorno</option>
            <option value="Solucionado">Solucionado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Data
          <input
            name="date"
            type="date"
            required
            defaultValue={inputDate(email?.date ?? null)}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
      </div>
      <FileUpload
        name="attachmentUrl"
        label="Arquivo do e-mail"
        defaultValue={email?.attachmentUrl ?? ""}
      />
      <MultiFileUpload
        name="attachments"
        label="Arquivos relacionados"
        defaultValue={(email?.attachments ?? []).map((attachment: any) => ({
          name: attachment.name,
          fileUrl: attachment.fileUrl,
        }))}
      />
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Salvar
      </button>
    </form>
  );
}

// ─── Atas Tab ───────────────────────────────────────────────────────────────

function AtasTab({ project, people }: { project: any; people: string[] }) {
  const minutes = project.meetingMinutes ?? [];
  return (
    <>
      <div className="mb-4 flex justify-end">
        <DialogAction
          title="Cadastrar ata"
          description="Inclua uma ata ou registro de reuniao."
          trigger="create"
          triggerLabel="Nova ata"
        >
          <MinuteForm projectId={project.id} people={people} />
        </DialogAction>
      </div>
      <section className="grid gap-3">
        {minutes.map((minute: any) => (
          <article
            key={minute.id}
            className="rounded-lg border border-line bg-white p-4 text-sm shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {formatDate(minute.meetingDate)} |{" "}
                  {minute.meetingType ?? "Reuniao"} | {minute.status}
                </p>
                <h2 className="mt-1 font-bold text-ink">{minute.title}</h2>
                <p className="mt-1 text-slate-600">{minute.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Participantes: {minute.participants ?? "-"}
                </p>
              </div>
              <div className="flex gap-2">
                <DialogAction
                  title="Editar ata"
                  description={minute.title}
                  trigger="edit"
                >
                  <MinuteForm
                    projectId={project.id}
                    minute={minute}
                    people={people}
                  />
                </DialogAction>
                <DialogAction
                  title="Excluir ata"
                  description={`Deseja realmente excluir "${minute.title}"?`}
                  trigger="delete"
                >
                  <form
                    action={deleteMeetingMinuteAction}
                    className="flex justify-end"
                  >
                    <input type="hidden" name="minuteId" value={minute.id} />
                    <input
                      type="hidden"
                      name="projectId"
                      value={project.id}
                    />
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                      Sim, excluir
                    </button>
                  </form>
                </DialogAction>
              </div>
            </div>
          </article>
        ))}
        {!minutes.length ? (
          <p className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">
            Nenhuma ata cadastrada.
          </p>
        ) : null}
      </section>
    </>
  );
}

function MinuteForm({
  projectId,
  minute,
  people,
}: {
  projectId: string;
  minute?: any;
  people: string[];
}) {
  return (
    <form action={upsertMeetingMinuteAction} className="grid gap-3">
      {minute ? (
        <input type="hidden" name="minuteId" value={minute.id} />
      ) : null}
      <input type="hidden" name="projectId" value={projectId} />
      <label className="grid gap-1 text-sm font-medium">
        Titulo
        <input
          name="title"
          required
          defaultValue={minute?.title ?? ""}
          className="h-10 rounded-md border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Resumo
        <textarea
          name="summary"
          defaultValue={minute?.summary ?? ""}
          rows={3}
          className="rounded-md border border-line px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Data
          <input
            name="meetingDate"
            type="date"
            required
            defaultValue={inputDate(minute?.meetingDate ?? null)}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            name="meetingType"
            defaultValue={
              minute?.meetingType ?? "Reunião de acompanhamento"
            }
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Reunião de acompanhamento">
              Reuniao de acompanhamento
            </option>
            <option value="Reunião executiva">Reuniao executiva</option>
            <option value="Reunião técnica">Reuniao tecnica</option>
            <option value="Comitê do projeto">Comite do projeto</option>
            <option value="Workshop">Workshop</option>
            <option value="Outro">Outro</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={minute?.status ?? "Publicado"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Rascunho">Rascunho</option>
            <option value="Em revisão">Em revisao</option>
            <option value="Publicado">Publicado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </label>
      </div>
      <PeopleMultiSelect
        name="participants"
        label="Participantes"
        people={people}
        defaultValue={minute?.participants ?? ""}
      />
      <FileUpload
        name="fileUrl"
        label="Arquivo"
        defaultValue={minute?.fileUrl ?? ""}
      />
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Salvar
      </button>
    </form>
  );
}

// ─── Planos Tab ─────────────────────────────────────────────────────────────

function PlanosTab({ project }: { project: any }) {
  const plans = project.documents.filter(
    (d: any) =>
      d.type === "Plano do projeto" ||
      d.type === "Cronograma" ||
      d.type === "Contrato"
  );
  return (
    <>
      <div className="mb-4 flex justify-end">
        <DialogAction
          title="Adicionar plano"
          description="Envie um plano, cronograma ou contrato do projeto."
          trigger="create"
          triggerLabel="Novo plano"
        >
          <PlanForm projectId={project.id} />
        </DialogAction>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="grid gap-2">
          {plans.map((document: any) => (
            <div
              key={document.id}
              className="rounded-md border border-line p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{document.name}</p>
                  <p className="text-slate-500">
                    {document.type} | {document.status} |{" "}
                    {document.version ?? "sem versao"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {document.embedUrl ? (
                    <a
                      href={document.embedUrl}
                      target="_blank"
                      className="rounded-md border border-line px-3 py-1.5 font-semibold"
                    >
                      Ver
                    </a>
                  ) : null}
                  {document.downloadUrl || document.externalUrl ? (
                    <a
                      href={getDocumentHref(document)}
                      target="_blank"
                      className="rounded-md bg-brand-600 px-3 py-1.5 font-semibold text-white"
                    >
                      Acessar
                    </a>
                  ) : null}
                  <DialogAction
                    title="Editar plano"
                    description={document.name}
                    trigger="edit"
                  >
                    <PlanForm projectId={project.id} document={document} />
                  </DialogAction>
                  <DialogAction
                    title="Excluir plano"
                    description={`Deseja realmente excluir "${document.name}"?`}
                    trigger="delete"
                  >
                    <form
                      action={deleteProjectDocumentAction}
                      className="flex justify-end"
                    >
                      <input
                        type="hidden"
                        name="documentId"
                        value={document.id}
                      />
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                        Sim, excluir
                      </button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            </div>
          ))}
          {!plans.length ? (
            <p className="text-sm text-slate-500">
              Nenhum plano cadastrado.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function PlanForm({
  projectId,
  document,
}: {
  projectId: string;
  document?: any;
}) {
  const isEdit = !!document;
  return (
    <form
      action={
        isEdit ? updateProjectDocumentAction : createProjectDocumentAction
      }
      className="grid gap-3"
    >
      {isEdit ? (
        <input type="hidden" name="documentId" value={document.id} />
      ) : null}
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input
            name="name"
            required
            defaultValue={document?.name ?? ""}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            name="type"
            defaultValue={document?.type ?? "Plano do projeto"}
            required
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Plano do projeto">Plano do projeto</option>
            <option value="Cronograma">Cronograma</option>
            <option value="Contrato">Contrato</option>
          </select>
        </label>
      </div>
      <input type="hidden" name="externalUrl" value={document?.externalUrl ?? ""} />
      <input type="hidden" name="embedUrl" value={document?.embedUrl ?? ""} />
      <FileUpload
        name="downloadUrl"
        label="Arquivo"
        required={!isEdit}
        defaultValue={document?.downloadUrl ?? document?.externalUrl ?? ""}
      />
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Versao
          <input
            name="version"
            placeholder="v1.0"
            defaultValue={document?.version ?? ""}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={document?.status ?? "Aprovado"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Rascunho">Rascunho</option>
            <option value="Em revisão">Em revisao</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Publicado">Publicado</option>
            <option value="Obsoleto">Obsoleto</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Visibilidade
          <select
            name="visibility"
            defaultValue={document?.visibility ?? "CLIENT_VISIBLE"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="CLIENT_VISIBLE">Cliente</option>
            <option value="PROJECT_TEAM">Equipe</option>
            <option value="INTERNAL">Interno</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="clientDownloadAllowed"
          type="checkbox"
          defaultChecked={document?.clientDownloadAllowed ?? true}
        />{" "}
        Permitir download pelo cliente
      </label>
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        {isEdit ? "Salvar" : "Adicionar plano"}
      </button>
    </form>
  );
}

// ─── Documentos Tab ─────────────────────────────────────────────────────────

function DocumentosTab({ project }: { project: any }) {
  const docs = project.documents.filter(
    (d: any) =>
      d.type !== "Plano do projeto" &&
      d.type !== "Cronograma" &&
      d.type !== "Contrato"
  );
  return (
    <>
      <div className="mb-4 flex justify-end">
        <DialogAction
          title="Adicionar documento"
          description="Envie um arquivo de ate 10 MB para o projeto."
          trigger="create"
          triggerLabel="Novo documento"
        >
          <DocumentForm projectId={project.id} />
        </DialogAction>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="grid gap-2">
          {docs.map((document: any) => (
            <div
              key={document.id}
              className="rounded-md border border-line p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{document.name}</p>
                  <p className="text-slate-500">
                    {document.type} | {document.sourceType} |{" "}
                    {document.visibility} | {document.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {document.embedUrl ? (
                    <a
                      href={document.embedUrl}
                      target="_blank"
                      className="rounded-md border border-line px-3 py-1.5 font-semibold"
                    >
                      Ver
                    </a>
                  ) : null}
                  {document.downloadUrl || document.externalUrl ? (
                    <a
                      href={getDocumentHref(document)}
                      target="_blank"
                      className="rounded-md bg-brand-600 px-3 py-1.5 font-semibold text-white"
                    >
                      Acessar
                    </a>
                  ) : null}
                  <DialogAction
                    title="Editar documento"
                    description={document.name}
                    trigger="edit"
                  >
                    <DocumentForm
                      projectId={project.id}
                      document={document}
                    />
                  </DialogAction>
                  <DialogAction
                    title="Excluir documento"
                    description={`Deseja realmente excluir "${document.name}"?`}
                    trigger="delete"
                  >
                    <form
                      action={deleteProjectDocumentAction}
                      className="flex justify-end"
                    >
                      <input
                        type="hidden"
                        name="documentId"
                        value={document.id}
                      />
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                        Sim, excluir
                      </button>
                    </form>
                  </DialogAction>
                </div>
              </div>
            </div>
          ))}
          {!docs.length ? (
            <p className="text-sm text-slate-500">
              Nenhum documento enviado.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DocumentForm({
  projectId,
  document,
}: {
  projectId: string;
  document?: any;
}) {
  const isEdit = !!document;
  return (
    <form
      action={
        isEdit ? updateProjectDocumentAction : createProjectDocumentAction
      }
      className="grid gap-3"
    >
      {isEdit ? (
        <input type="hidden" name="documentId" value={document.id} />
      ) : null}
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input
            name="name"
            required
            defaultValue={document?.name ?? ""}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            name="type"
            defaultValue={document?.type ?? "Relatório"}
            required
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Relatório">Relatorio</option>
            <option value="Evidência">Evidencia</option>
            <option value="Outro documento">Outro documento</option>
          </select>
        </label>
      </div>
      <input type="hidden" name="externalUrl" value={document?.externalUrl ?? ""} />
      <input type="hidden" name="embedUrl" value={document?.embedUrl ?? ""} />
      <FileUpload
        name="downloadUrl"
        label="Arquivo"
        required={!isEdit}
        defaultValue={document?.downloadUrl ?? document?.externalUrl ?? ""}
      />
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Versao
          <input
            name="version"
            placeholder="v1.0"
            defaultValue={document?.version ?? ""}
            className="h-10 rounded-md border border-line px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={document?.status ?? "Aprovado"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="Rascunho">Rascunho</option>
            <option value="Em revisão">Em revisao</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Publicado">Publicado</option>
            <option value="Obsoleto">Obsoleto</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Visibilidade
          <select
            name="visibility"
            defaultValue={document?.visibility ?? "CLIENT_VISIBLE"}
            className="h-10 rounded-md border border-line px-3"
          >
            <option value="CLIENT_VISIBLE">Cliente</option>
            <option value="PROJECT_TEAM">Equipe</option>
            <option value="INTERNAL">Interno</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="clientDownloadAllowed"
          type="checkbox"
          defaultChecked={document?.clientDownloadAllowed ?? true}
        />{" "}
        Permitir download pelo cliente
      </label>
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        {isEdit ? "Salvar" : "Adicionar documento"}
      </button>
    </form>
  );
}

function getDocumentHref(document: {
  id: string;
  downloadUrl?: string | null;
  externalUrl?: string | null;
}) {
  const href = document.downloadUrl ?? document.externalUrl ?? "#";
  return href.startsWith("data:")
    ? `/api/files/document?documentId=${document.id}`
    : href;
}
