"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Download, FileText, Mail, ScrollText } from "lucide-react";
import { formatDate } from "@/lib/format";

const docTabKeys = ["emails", "atas", "planos", "documentos"] as const;
type DocTabKey = (typeof docTabKeys)[number];

const docTabLabels: Record<DocTabKey, string> = {
  emails: "E-mails",
  atas: "Atas",
  planos: "Planos",
  documentos: "Documentos importantes",
};

function ModulePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500" />
        <div className="flex items-start gap-3.5">
          {Icon ? (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 shadow-sm">
              <Icon size={18} className="text-blue-600" />
            </div>
          ) : null}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
            <h2 className="mt-0.5 text-2xl font-black text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}

function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className ?? ""}`}>
      {title ? (
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
}) {
  const cfg = {
    slate: { card: "bg-white border-slate-100", text: "text-slate-950", label: "text-slate-400", accent: "bg-slate-300" },
    green: { card: "bg-white border-emerald-100", text: "text-emerald-700", label: "text-emerald-500", accent: "bg-emerald-400" },
    amber: { card: "bg-white border-amber-100", text: "text-amber-700", label: "text-amber-500", accent: "bg-amber-400" },
    red:   { card: "bg-white border-red-100",   text: "text-red-700",   label: "text-red-400",   accent: "bg-red-400" },
    blue:  { card: "bg-white border-blue-100",  text: "text-blue-700",  label: "text-blue-500",  accent: "bg-blue-400" },
  }[tone];
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 ${cfg.card}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${cfg.accent}`} />
      <p className={`pl-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${cfg.label}`}>{label}</p>
      <p className={`mt-2 pl-1.5 text-3xl font-black ${cfg.text}`}>{value}</p>
    </div>
  );
}

function Empty({ label, icon: Icon }: { label: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <Icon size={20} className="text-slate-400" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function countBy(items: any[], key: string) {
  const result: Record<string, number> = {};
  for (const item of items) {
    const val = item[key] ?? "Sem categoria";
    result[val] = (result[val] ?? 0) + 1;
  }
  return result;
}

function getDocumentDownloadHref(doc: { id: string; downloadUrl?: string | null; externalUrl?: string | null }) {
  const href = doc.downloadUrl ?? doc.externalUrl ?? "#";
  return href.startsWith("data:") ? `/api/files/document?documentId=${doc.id}` : href;
}

function PortalEmailAttachmentLinks({ email, compact = false }: { email: any; compact?: boolean }) {
  const links = [
    ...(email.attachments ?? []).map((attachment: any) => ({ name: attachment.name, href: attachment.fileUrl?.startsWith("data:") ? `/api/files/email?attachmentId=${attachment.id}` : attachment.fileUrl })),
    ...(email.attachmentUrl ? [{ name: "Acessar e-mail", href: email.attachmentUrl.startsWith("data:") ? `/api/files/email?emailId=${email.id}` : email.attachmentUrl }] : [])
  ];

  if (!links.length) return null;

  return (
    <div className={compact ? "mt-2 flex flex-wrap gap-1.5" : "mt-4 flex flex-wrap gap-2"}>
      {links.map((attachment, index) => (
        <Link
          key={`${attachment.name}-${index}`}
          href={attachment.href}
          target="_blank"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#062553] px-3 py-2 text-xs font-bold text-white hover:bg-[#0f1b3d]"
        >
          <Mail size={12} />
          {attachment.name}
        </Link>
      ))}
    </div>
  );
}

export function DocumentsModule({ project }: { project: any }) {
  const [activeTab, setActiveTab] = useState<DocTabKey>("emails");

  return (
    <ModulePage
      eyebrow="Documentos"
      icon={FileText}
      title="Documentos do projeto"
      description="E-mails, atas, planos e documentos importantes centralizados em um so lugar."
    >
      <div className="flex flex-wrap gap-2">
        {docTabKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeTab === key
                ? "bg-[#062553] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {docTabLabels[key]}
          </button>
        ))}
      </div>

      {activeTab === "emails" && <PortalEmailsTab project={project} />}
      {activeTab === "atas" && <PortalAtasTab project={project} />}
      {activeTab === "planos" && <PortalPlanosTab project={project} />}
      {activeTab === "documentos" && <PortalDocumentosTab project={project} />}
    </ModulePage>
  );
}

function PortalEmailsTab({ project }: { project: any }) {
  const categories = countBy(project.importantEmails ?? [], "category");
  const emails = project.importantEmails ?? [];
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {emails.map((email: any) => {
          const isPending = email.status === "PENDENCIA" || email.status === "Pendencia";
          const initials = (email.origin ?? "E").slice(0, 2).toUpperCase();
          return (
            <div key={email.id} className="flex flex-col rounded-xl border border-l-4 border-slate-100 border-l-blue-400 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                  {initials}
                </div>
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      isPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {email.status}
                  </span>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatDate(email.date)}</p>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-black leading-5 text-slate-950">{email.subject}</h3>
              <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{email.summary}</p>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <p>
                  <strong className="text-slate-700">Origem:</strong> {email.origin ?? "-"}
                </p>
                <p>
                  <strong className="text-slate-700">Envolvidos:</strong> {email.involved ?? "-"}
                </p>
                <p>
                  <strong className="text-slate-700">Tipo:</strong> {email.category}
                </p>
              </div>
              <PortalEmailAttachmentLinks email={email} />
              {email.replies?.length ? (
                <div className="mt-4 grid gap-2 border-l-2 border-slate-200 pl-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Respostas relacionadas</p>
                  {email.replies.map((reply: any) => (
                    <div key={reply.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                      <p className="text-[11px] font-bold text-slate-400">{formatDate(reply.date)} | {reply.status}</p>
                      <h4 className="mt-1 text-xs font-black text-slate-900">{reply.subject}</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{reply.summary}</p>
                      <PortalEmailAttachmentLinks email={reply} compact />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {!emails.length ? <div className="col-span-full"><Empty label="Nenhum e-mail registrado." icon={Mail} /></div> : null}
      </div>
      <Panel title="Resumo">
        <Metric label="E-mails" value={emails.length} tone="blue" />
        <div className="mt-4 grid gap-2">
          {Object.entries(categories).map(([cat, total]) => (
            <div key={cat} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-600">{cat}</span>
              <strong>{Number(total)}</strong>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PortalAtasTab({ project }: { project: any }) {
  const minutes = project.meetingMinutes ?? [];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {minutes.map((minute: any) => (
        <div key={minute.id} className="flex flex-col rounded-xl border border-l-4 border-slate-100 border-l-blue-400 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">{minute.status}</span>
            <span className="text-xs font-semibold text-slate-400">{formatDate(minute.meetingDate)}</span>
          </div>
          <h3 className="mt-3 font-black text-slate-950">{minute.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{minute.summary}</p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <p>
              <strong className="text-slate-700">Reuniao:</strong> {minute.meetingType ?? "-"}
            </p>
            <p>
              <strong className="text-slate-700">Participantes:</strong> {minute.participants ?? "-"}
            </p>
          </div>
          {minute.fileUrl ? (
            <Link href={minute.fileUrl.startsWith("data:") ? `/api/files/document?documentId=${minute.id}` : minute.fileUrl} target="_blank" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#062553] px-3 py-2 text-xs font-bold text-white hover:bg-[#0f1b3d]">
              <BookOpen size={12} />
              Abrir ata
            </Link>
          ) : null}
        </div>
      ))}
      {!minutes.length ? <div className="col-span-full"><Empty label="Nenhuma ata registrada." icon={ScrollText} /></div> : null}
    </div>
  );
}

function PortalPlanosTab({ project }: { project: any }) {
  const plans = project.documents.filter(
    (d: any) => d.type === "Plano do projeto" || d.type === "Cronograma" || d.type === "Contrato"
  );
  const byStatus = countBy(plans, "status");
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Panel title="Planos e contratos do projeto">
        <div className="grid gap-3">
          {plans.map((doc: any) => (
            <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{doc.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {doc.type} · {doc.status} · {doc.version ?? "sem versao"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.embedUrl ? (
                    <Link href={doc.embedUrl} target="_blank" className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      Visualizar
                    </Link>
                  ) : null}
                  {doc.downloadUrl || doc.externalUrl ? (
                    <Link href={getDocumentDownloadHref(doc)} target="_blank" className="rounded-full bg-[#0f1b3d] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a2d5a]">
                      Baixar
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {!plans.length ? <Empty label="Nenhum plano cadastrado." icon={FileText} /> : null}
        </div>
      </Panel>
      <Panel title="Resumo">
        <Metric label="Total de planos" value={plans.length} tone="blue" />
        <div className="mt-4 grid gap-2">
          {Object.entries(byStatus).map(([status, total]) => (
            <div key={status} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-600">{status}</span>
              <strong>{Number(total)}</strong>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PortalDocumentosTab({ project }: { project: any }) {
  const docs = project.documents.filter(
    (d: any) => d.type !== "Plano do projeto" && d.type !== "Cronograma" && d.type !== "Contrato"
  );
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc: any) => (
        <div key={doc.id} className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <FileText size={18} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-black text-[#06326e]">{doc.name}</h3>
          <p className="mt-1.5 min-h-14 flex-1 text-xs leading-5 text-slate-500">
            {doc.type} · {doc.status} · {doc.version ?? "sem versao"}
          </p>
          {doc.downloadUrl || doc.externalUrl ? (
            <Link
              href={getDocumentDownloadHref(doc)}
              target="_blank"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#062553] px-3 py-2 text-xs font-bold text-white hover:bg-[#0f1b3d]"
            >
              <Download size={12} />
              Acessar documento
            </Link>
          ) : null}
        </div>
      ))}
      {!docs.length ? (
        <div className="col-span-full">
          <Empty label="Nenhum documento disponivel." icon={Download} />
        </div>
      ) : null}
    </div>
  );
}
