import Link from "next/link";
import { EdtExpandControls } from "@/features/portal/edt-expand-controls";
import { ExecutiveBarChart, MiniPieChart, ProgressLineChart } from "@/features/portal/public-portal-charts";
import { formatDate, formatHours } from "@/lib/format";

type PublicPortalShellProps = {
  token: string;
  project: any;
  modules: Array<{ key: string; label: string }>;
  activeModule: string;
  children: React.ReactNode;
};

type PublicPortalModuleLink = { key: string; label: string };

const moduleTone: Record<string, string> = {
  home: "from-sky-500 to-blue-700",
  governance: "from-violet-500 to-indigo-700",
  plans: "from-cyan-500 to-sky-700",
  downloads: "from-cyan-500 to-blue-800",
  emails: "from-sky-500 to-indigo-800",
  minutes: "from-blue-500 to-slate-800",
  milestones: "from-amber-400 to-orange-700",
  planning: "from-blue-500 to-slate-800",
  risks: "from-red-500 to-rose-800",
  dashboard: "from-slate-700 to-slate-950"
};

const navigationGroups = [
  { label: "Visao geral", keys: ["home", "milestones"] },
  { label: "Governanca", keys: ["governance", "emails", "minutes"] },
  { label: "Planejamento", keys: ["planning"] },
  { label: "Documentos", keys: ["plans", "downloads"] },
  { label: "Riscos e Bloqueios", keys: ["risks", "blockers"] }
];

export function PublicPortalShell({ token, project, modules, activeModule, children }: PublicPortalShellProps) {
  const health = getProjectHealth(project);
  const groupedNavigation = getNavigationGroups(modules);
  const dashboardModule = modules.find((module) => module.key === "dashboard");

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-900">
      <header className="relative min-h-[245px] overflow-hidden bg-[#062553] text-white">
        <div className={`absolute inset-0 bg-gradient-to-br ${moduleTone[activeModule] ?? moduleTone.dashboard} opacity-45`} />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,31,84,.96),rgba(0,67,128,.72),rgba(255,255,255,.08))]" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_26%),linear-gradient(135deg,transparent_0_48%,white_49%_50%,transparent_51%_100%)]" />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1360px] px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4 text-xs font-bold">
            <Link href={`/p/${token}`} className="text-base font-black tracking-tight">OFM Systems</Link>
            <nav className="hidden items-center gap-2 md:flex">
              {dashboardModule ? (
                <HeaderNavLink token={token} module={dashboardModule} active={activeModule === "dashboard"} />
              ) : null}
              {groupedNavigation.map((group) => (
                <DropdownNavGroup key={group.label} token={token} group={group} activeModule={activeModule} />
              ))}
            </nav>
          </div>

          <div className="mx-auto mt-12 max-w-5xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Portal PGP | Governanca de Projetos</p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{project.name}</h1>
            <p className="mt-3 text-sm font-semibold italic text-white/80">{project.client.name}</p>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-4">
            <HeroMetric label="Saude" value={health.label} tone={health.tone} />
            <HeroMetric label="Avanco" value={`${Number(project.progressPercent)}%`} />
            <HeroMetric label="Prazo" value={formatDate(project.currentEnd)} />
            <HeroMetric label="Bloqueios" value={project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED").length} />
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur md:hidden">
        <div className="grid gap-2 px-4 py-3">
          {groupedNavigation.map((group) => {
            const active = group.items.some((item) => item.key === activeModule);
            return (
              <details key={group.label} className="rounded-2xl border border-slate-200 bg-white open:shadow-md" open={active}>
                <summary className={`cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-black ${active ? "bg-[#06326e] text-white" : "text-slate-700"}`}>
                  {group.label}
                </summary>
                <div className="grid gap-1 p-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.key}
                      href={`/p/${token}/${item.key}`}
                      className={`rounded-xl px-3 py-2 text-sm font-bold ${item.key === activeModule ? "bg-blue-50 text-[#06326e]" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            );
          })}
          {dashboardModule ? (
            <Link href={`/p/${token}/dashboard`} className={`rounded-2xl px-4 py-3 text-sm font-black ${activeModule === "dashboard" ? "bg-[#06326e] text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              {dashboardModule.label}
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mx-auto max-w-[1360px] px-4 py-7 md:px-8">
        {children}
      </section>
    </main>
  );
}

function HeaderNavLink({ token, module, active }: { token: string; module: PublicPortalModuleLink; active: boolean }) {
  return (
    <Link
      href={`/p/${token}/${module.key}`}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black shadow-sm ring-1 ring-white/15 transition ${active ? "bg-white text-[#062553]" : "bg-white/8 text-white/86 hover:bg-white/14 hover:text-white"}`}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${active ? "bg-[#062553]/10" : "bg-white/15"}`}>D</span>
      <span>{module.label}</span>
    </Link>
  );
}

function getNavigationGroups(modules: PublicPortalModuleLink[]) {
  const modulesByKey = new Map(modules.map((module) => [module.key, module]));
  return navigationGroups
    .map((group) => ({
      label: group.label,
      items: group.keys.map((key) => modulesByKey.get(key)).filter(Boolean) as PublicPortalModuleLink[]
    }))
    .filter((group) => group.items.length > 0);
}

function DropdownNavGroup({ token, group, activeModule }: { token: string; group: { label: string; items: PublicPortalModuleLink[] }; activeModule: string }) {
  const active = group.items.some((item) => item.key === activeModule);
  const singleItem = group.items.length === 1 ? group.items[0] : null;

  if (singleItem) {
    return (
      <Link
        href={`/p/${token}/${singleItem.key}`}
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black shadow-sm ring-1 ring-white/15 transition ${active ? "bg-white text-[#062553]" : "bg-white/8 text-white/86 hover:bg-white/14 hover:text-white"}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px]">{groupIcon(group.label)}</span>
        <span>{group.label}</span>
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black shadow-sm ring-1 ring-white/15 transition ${active ? "bg-white text-[#062553]" : "bg-white/8 text-white/86 hover:bg-white/14 hover:text-white"}`}
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${active ? "bg-[#062553]/10" : "bg-white/15"}`}>{groupIcon(group.label)}</span>
        <span>{group.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition group-hover:rotate-180 ${active ? "text-[#062553]" : "text-white/75"}`} />
      </button>
      <div className="invisible absolute right-0 top-full z-50 w-72 pt-3 opacity-0 transition delay-150 duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 group-hover:delay-0">
        <div className="rounded-3xl border border-slate-200 bg-white p-2.5 text-slate-800 shadow-[0_24px_70px_rgba(15,23,42,.28)]">
        <div className="px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
        </div>
        {group.items.map((item) => (
          <Link
            key={item.key}
            href={`/p/${token}/${item.key}`}
            className={`group/item flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold transition ${item.key === activeModule ? "bg-blue-50 text-[#06326e]" : "text-slate-700 hover:bg-slate-50 hover:text-[#06326e]"}`}
          >
            <span className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${item.key === activeModule ? "bg-[#06326e]" : "bg-slate-300 group-hover/item:bg-[#06326e]"}`} />
              {item.label}
            </span>
            <span className="text-slate-300 transition group-hover/item:translate-x-0.5 group-hover/item:text-[#06326e]">→</span>
          </Link>
        ))}
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function groupIcon(label: string) {
  return ({
    "Visao geral": "◉",
    Governanca: "G",
    Planejamento: "P",
    Documentos: "D",
    "Riscos e Bloqueios": "!"
  } as Record<string, string>)[label] ?? "•";
}

function HeroMetric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/12 p-4 text-left shadow-xl backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className={`mt-2 text-xl font-black ${tone ?? "text-white"}`}>{value}</p>
    </div>
  );
}

export function PublicPortalModule({ moduleKey, project }: { moduleKey: string; project: any }) {
  if (moduleKey === "home") return <HomeModule project={project} />;
  if (moduleKey === "governance") return <GovernanceModule project={project} />;
  if (moduleKey === "plans") return <PlansModule project={project} />;
  if (moduleKey === "downloads") return <DownloadsModule project={project} />;
  if (moduleKey === "emails") return <EmailsModule project={project} />;
  if (moduleKey === "minutes") return <MinutesModule project={project} />;
  if (moduleKey === "milestones") return <MilestonesModule project={project} />;
  if (moduleKey === "planning") return <PlanningModule project={project} />;
  if (moduleKey === "risks") return <RisksModule project={project} />;
  if (moduleKey === "blockers") return <BlockersModule project={project} />;
  return <DashboardModule project={project} />;
}

function ModulePage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white bg-white p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <div className="mt-2">
          <h2 className="text-3xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </section>
      {children}
    </div>
  );
}

function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-white bg-white p-5 shadow-lg ${className ?? ""}`}>
      {title ? <h3 className="mb-4 text-lg font-black text-slate-950">{title}</h3> : null}
      {children}
    </section>
  );
}

function Metric({ label, value, detail, tone = "slate" }: { label: string; value: string | number; detail?: string; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-950",
    green: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    blue: "bg-blue-50 text-blue-800"
  };
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold opacity-65">{detail}</p> : null}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{label}</p>;
}

function HomeModule({ project }: { project: any }) {
  return (
    <ModulePage eyebrow="Home" title="Contexto executivo do projeto" description={project.home?.mission ?? project.description ?? "Missao do projeto nao cadastrada."}>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Proposta e escopo">
          <div className="grid gap-4">
            <InfoBlock title="Sobre o cliente" text={project.home?.clientOverview ?? project.client.name} />
            <InfoBlock title="Proposta" text={project.home?.proposal ?? "Proposta ainda nao cadastrada."} />
            <InfoBlock title="Escopo" text={project.home?.scope ?? "Escopo ainda nao cadastrado."} />
          </div>
        </Panel>
        <Panel title="Parceiros e frentes envolvidas">
          <div className="grid gap-3">
            {project.partners.map((partner: any) => (
              <div key={partner.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-950">{partner.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{partner.description ?? "Parceiro do projeto"}</p>
              </div>
            ))}
            {!project.partners.length ? <Empty label="Nenhum parceiro cadastrado." /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function GovernanceModule({ project }: { project: any }) {
  const quadrants = [
    ["HIGH", "HIGH", "Gerenciar de perto", "red"],
    ["HIGH", "LOW", "Manter satisfeito", "amber"],
    ["LOW", "HIGH", "Manter informado", "blue"],
    ["LOW", "LOW", "Monitorar", "slate"]
  ];
  const byType = countBy(project.stakeholders, "type");

  return (
    <ModulePage eyebrow="Governanca" title="Mapa de stakeholders e governanca" description="Visao analitica de influencia, interesse, papel no projeto e estrategia de relacionamento.">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Panel title="Mapa influencia x interesse">
          <div className="grid gap-3 md:grid-cols-2">
            {quadrants.map(([influence, interest, label, tone]) => {
              const items = project.stakeholders.filter((item: any) => item.influence === influence && item.interest === interest);
              return (
                <div key={`${influence}-${interest}`} className="min-h-44 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className={`text-sm font-black ${tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : tone === "blue" ? "text-blue-700" : "text-slate-700"}`}>{label}</p>
                  <p className="mt-1 text-xs text-slate-500">Influencia {levelPt(String(influence))} | Interesse {levelPt(String(interest))}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((item: any) => <span key={item.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">{item.name}</span>)}
                    {!items.length ? <span className="text-xs text-slate-400">Sem stakeholders</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Analytics de stakeholders">
          <div className="grid gap-3">
            <Metric label="Total" value={project.stakeholders.length} tone="blue" />
            <Metric label="Criticos" value={project.stakeholders.filter((item: any) => item.influence === "HIGH" && item.interest === "HIGH").length} tone="red" />
            <MiniPieChart data={Object.entries(byType).map(([name, value]) => ({ name, value: Number(value) }))} />
          </div>
        </Panel>
      </div>
      <Panel title="Cadastro de stakeholders">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="py-3">Nome</th><th>Empresa</th><th>Papel</th><th>Tipo</th><th>Influencia</th><th>Interesse</th><th>Classificacao</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {project.stakeholders.map((item: any) => (
                <tr key={item.id}><td className="py-3 font-bold">{item.name}</td><td>{item.company ?? "-"}</td><td>{item.projectRole ?? item.jobTitle ?? "-"}</td><td>{stakeholderTypePt(item.type)}</td><td>{levelPt(item.influence)}</td><td>{levelPt(item.interest)}</td><td>{item.classification ?? "-"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </ModulePage>
  );
}

function PlansModule({ project }: { project: any }) {
  const byStatus = countBy(project.documents, "status");
  return (
    <ModulePage eyebrow="Planos" title="Biblioteca de planos do projeto" description="Documentos, versoes, status e links de download disponibilizados via Google Drive.">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="Documentos liberados ao cliente">
          <div className="grid gap-3">
            {project.documents.map((document: any) => (
              <div key={document.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{document.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{document.type} | {document.status} | {document.version ?? "sem versao"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document.embedUrl ? <Link href={document.embedUrl} target="_blank" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700">Visualizar</Link> : null}
                    {document.downloadUrl || document.externalUrl ? <Link href={document.downloadUrl ?? document.externalUrl} target="_blank" className="rounded-full bg-[#0f1b3d] px-4 py-2 text-xs font-black text-white">Baixar</Link> : null}
                  </div>
                </div>
              </div>
            ))}
            {!project.documents.length ? <Empty label="Nenhum documento liberado para o cliente." /> : null}
          </div>
        </Panel>
        <Panel title="Resumo documental">
          <Metric label="Total de documentos" value={project.documents.length} tone="blue" />
          <div className="mt-4 grid gap-2">
            {Object.entries(byStatus).map(([status, total]) => <div key={status} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{status}</span><strong>{Number(total)}</strong></div>)}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function DownloadsModule({ project }: { project: any }) {
  return (
    <ModulePage eyebrow="Downloads" title="Documentos importantes" description="Central de arquivos liberados para consulta e download pelo cliente.">
      <div className="mx-auto max-w-5xl rounded-xl bg-[#f1f5f9] p-8 shadow-inner">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {project.documents.map((document: any) => (
            <div key={document.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b5a94] text-sm font-black text-white">D</div>
              <h3 className="text-sm font-black text-[#06326e]">{document.name}</h3>
              <p className="mt-2 min-h-16 text-xs leading-5 text-slate-600">{document.type} | {document.status} | {document.version ?? "sem versao"}</p>
              {document.downloadUrl || document.externalUrl ? (
                <Link href={document.downloadUrl ?? document.externalUrl} target="_blank" className="mt-4 inline-flex rounded-md bg-[#062553] px-3 py-2 text-xs font-black text-white">Acessar documento</Link>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-500">Ultima atualizacao dos documentos conforme governanca vigente do projeto.</p>
      </div>
    </ModulePage>
  );
}

function EmailsModule({ project }: { project: any }) {
  const categories = countBy(project.importantEmails ?? [], "category");
  return (
    <ModulePage eyebrow="Comunicacoes" title="E-mails importantes" description="Registro de comunicacoes formais, decisoes, pendencias e alinhamentos relevantes do projeto.">
      <FilterStrip search="Pesquisar por assunto, origem, envolvidos ou palavra-chave..." selects={["Todas as categorias", "Todos os status"]} />
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(project.importantEmails ?? []).map((email: any) => (
              <div key={email.id} className="rounded-xl border border-slate-200 border-l-[#0874c9] border-l-4 bg-white p-5 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg">E</div>
                  <div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${email.status === "PENDENCIA" || email.status === "Pendencia" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{email.status}</span>
                    <p className="mt-1 text-xs font-bold text-slate-500">Data: {formatDate(email.date)}</p>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-black text-slate-950">{email.subject}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{email.summary}</p>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5">
                  <p><strong>Origem:</strong> {email.origin ?? "-"}</p>
                  <p><strong>Envolvidos:</strong> {email.involved ?? "-"}</p>
                  <p><strong>Tipo:</strong> {email.category}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Resumo">
          <Metric label="E-mails" value={(project.importantEmails ?? []).length} tone="blue" />
          <div className="mt-4 grid gap-2">{Object.entries(categories).map(([category, total]) => <div key={category} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{category}</span><strong>{Number(total)}</strong></div>)}</div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function MinutesModule({ project }: { project: any }) {
  return (
    <ModulePage eyebrow="Central de atas" title="Atas, reunioes e decisoes" description="Repositorio executivo de atas publicadas, participantes, tipo de reuniao e encaminhamentos principais.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(project.meetingMinutes ?? []).map((minute: any) => (
          <div key={minute.id} className="rounded-xl border border-slate-200 border-l-[#0874c9] border-l-4 bg-white p-5 shadow-md">
            <div className="mb-3 flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">{minute.status}</span><span className="text-xs font-bold text-slate-500">{formatDate(minute.meetingDate)}</span></div>
            <h3 className="font-black text-slate-950">{minute.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{minute.summary}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5"><p><strong>Reuniao:</strong> {minute.meetingType ?? "-"}</p><p><strong>Participantes:</strong> {minute.participants ?? "-"}</p></div>
            {minute.fileUrl ? <Link href={minute.fileUrl} target="_blank" className="mt-4 inline-flex rounded-md bg-[#062553] px-3 py-2 text-xs font-black text-white">Abrir ata</Link> : null}
          </div>
        ))}
      </div>
    </ModulePage>
  );
}

function MilestonesModule({ project }: { project: any }) {
  return (
    <ModulePage eyebrow="Marcos" title="Timeline executiva dos marcos" description="Principais entregas, aprovacoes, decisoes e eventos do projeto.">
      <Panel>
        <h3 className="mb-10 text-center text-2xl font-black text-[#064b8e]">Marcos do Projeto</h3>
        <div className="overflow-x-auto pb-3">
          <div className="relative flex min-w-[900px] items-start justify-between gap-4 px-6 pt-3 before:absolute before:left-14 before:right-14 before:top-10 before:h-[3px] before:bg-blue-500">
            {project.milestones.map((milestone: any, index: number) => (
              <div key={milestone.id} className="relative z-10 flex w-36 flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-blue-100 bg-[#063eb3] text-2xl font-black text-white shadow-lg">{index + 1}</div>
                <div className="mt-6 min-h-48 w-full rounded-xl border border-blue-100 bg-white p-4 shadow-lg">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-[#063eb3]">{index + 1}</div>
                  <p className="font-black text-[#063eb3]">{milestone.name}</p>
                  <div className="mx-auto my-3 h-px w-8 bg-blue-300" />
                  <p className="text-sm leading-5 text-slate-600">{milestone.description ?? milestone.type ?? "Marco do projeto"}</p>
                  <p className="mt-3 text-[11px] font-bold text-slate-500">{formatDate(milestone.plannedDate)}</p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">{statusPt(milestone.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </ModulePage>
  );
}

function PlanningModule({ project }: { project: any }) {
  const tasks = sortTasksForEdt(project.tasks ?? []);
  const taskTree = buildTaskTree(tasks);
  const done = tasks.filter((task: any) => task.status === "DONE").length;
  const delayed = tasks.filter((task: any) => task.status !== "DONE" && task.plannedEnd < new Date()).length;
  const statusData = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].map((status) => ({ name: statusPt(status), value: tasks.filter((task: any) => task.status === status).length }));
  const hoursData = tasks.slice(0, 8).map((task: any) => ({ name: task.wbsCode ?? task.name.slice(0, 8), planejadas: Number(task.estimatedHours), executadas: Number(task.actualHours) }));

  return (
    <ModulePage eyebrow="Planejamento" title="Cronograma, EDT e analise de horas" description="Visao executiva do cronograma importado/cadastrado, com acompanhamento de avancos, horas e desvios.">
      <section className="rounded-3xl bg-gradient-to-br from-[#062553] to-[#2457d6] p-6 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Portal PGP | Governanca de Projetos</p>
        <h3 className="mt-2 text-3xl font-black">Cronograma Executivo do Projeto</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold text-white/85">Visao integrada do cronograma com EDT, atividades, responsaveis, prazos, horas planejadas, horas executadas, avanco, marcos e semaforo gerencial.</p>
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-black"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Sincronizado automaticamente</p>
          <div className="grid gap-3 md:grid-cols-2"><HeroDetail label="Inicio do projeto" value={formatDate(project.plannedStart)} /><HeroDetail label="Fim planejado" value={formatDate(project.plannedEnd)} /><HeroDetail label="Responsaveis" value={String(new Set(project.tasks.map((task: any) => task.owner?.name).filter(Boolean)).size)} /><HeroDetail label="Ultima atualizacao" value={new Date().toLocaleString("pt-BR")} /></div>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-4">
        <Metric label="Atividades" value={tasks.length} detail={`${done} concluidas`} tone="blue" />
        <Metric label="Atrasadas" value={delayed} tone={delayed ? "red" : "green"} />
        <Metric label="Horas planejadas" value={formatHours(project.plannedHours)} tone="slate" />
        <Metric label="Horas executadas" value={formatHours(project.actualHours)} tone="green" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Atividades por status"><MiniPieChart data={statusData} /></Panel>
        <Panel title="Horas por pacote EDT"><ExecutiveBarChart data={hoursData} bars={[{ key: "planejadas", color: "#2563eb" }, { key: "executadas", color: "#16a34a" }]} /></Panel>
      </div>
      <FilterStrip search="Digite parte da descricao, item ou responsavel" selects={["Responsavel", "Semaforo", "Nivel EDT", "Tipo"]} button="Limpar filtros" />
      <Panel title="EDT e cronograma detalhado">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">Pacotes com seta possuem atividades abaixo. Clique na linha para abrir o detalhamento.</p>
          <EdtExpandControls />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1220px] overflow-hidden rounded-xl border border-blue-100 text-xs">
            <div className="grid grid-cols-[64px_300px_116px_90px_108px_90px_112px_112px_70px_86px_70px] bg-[#062553] font-black text-white">
              {[
                "EDT",
                "Atividade",
                "Responsavel",
                "Inicio",
                "Fim planejado",
                "Fim real",
                "Horas planejadas",
                "Horas executadas",
                "Avanco",
                "Status",
                "Semaforo"
              ].map((header) => <div key={header} className="px-3 py-4">{header}</div>)}
            </div>
            <div className="divide-y divide-blue-100">
              {taskTree.map((node: any, index: number) => <TaskEdtNode key={node.task.id} node={node} index={index} />)}
            </div>
          </div>
        </div>
        {!tasks.length ? <Empty label="Nenhuma atividade cadastrada no cronograma." /> : null}
      </Panel>
    </ModulePage>
  );
}

function TaskEdtNode({ node, index }: { node: any; index: number }) {
  const task = node.task;
  const hasChildren = node.children.length > 0;
  const late = task.status !== "DONE" && task.plannedEnd < new Date();
  const level = Math.max(1, Number(task.outlineLevel ?? 1));
  const row = (
    <div className={`grid grid-cols-[64px_300px_116px_90px_108px_90px_112px_112px_70px_86px_70px] items-start ${hasChildren ? "bg-blue-100/70" : index % 2 === 0 ? "bg-blue-50/60" : "bg-white"}`}>
      <div className={`px-3 py-4 font-black ${hasChildren ? "text-[#062553]" : "text-[#17406f]"}`}>{task.wbsCode ?? "-"}</div>
      <div className="px-3 py-4 font-bold text-slate-900" style={{ paddingLeft: `${8 + (level - 1) * 18}px` }}>
        {hasChildren ? (
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#062553] text-[11px] font-black text-white shadow-sm group-open:hidden">+</span>
        ) : (
          <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-blue-300" />
        )}
        {hasChildren ? <span className="mr-2 hidden h-6 w-6 items-center justify-center rounded-full bg-[#062553] text-[11px] font-black text-white shadow-sm group-open:inline-flex">-</span> : null}
        <span className={hasChildren ? "font-black text-[#062553]" : ""}>{task.name}</span>
        {hasChildren ? <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#062553] ring-1 ring-blue-200">{node.children.length} subitem(ns)</span> : null}
      </div>
      <div className="px-3 py-4">{task.owner?.name ?? "-"}</div>
      <div className="px-3 py-4">{formatDate(task.plannedStart)}</div>
      <div className="px-3 py-4">{formatDate(task.plannedEnd)}</div>
      <div className="px-3 py-4">{formatDate(task.actualEnd)}</div>
      <div className="px-3 py-4">{formatHours(task.estimatedHours)}</div>
      <div className="px-3 py-4">{formatHours(task.actualHours)}</div>
      <div className="px-3 py-4">{Number(task.progressPercent)}%</div>
      <div className="px-3 py-4">{statusPt(task.status)}</div>
      <div className="px-3 py-4"><span className={`inline-flex h-3 w-3 rounded-full ${task.status === "DONE" ? "bg-emerald-500" : late ? "bg-red-500" : "bg-amber-400"}`} /></div>
    </div>
  );

  if (!hasChildren) {
    return (
      <details className="group" data-edt-detail>
        <summary className="cursor-pointer list-none">{row}</summary>
        <TaskDetails task={task} />
      </details>
    );
  }

  return (
    <details className="group" open data-edt-detail>
      <summary className="cursor-pointer list-none">{row}</summary>
      <TaskDetails task={task} />
      <div className="border-t border-blue-100">
        {node.children.map((child: any, childIndex: number) => <TaskEdtNode key={child.task.id} node={child} index={childIndex} />)}
      </div>
    </details>
  );
}

function TaskDetails({ task }: { task: any }) {
  const dependencies = (task.predecessors ?? []).map((dependency: any) => `${dependency.predecessor?.wbsCode ?? "-"} ${dependency.predecessor?.name ?? ""}`).filter(Boolean).join("; ");
  return (
    <div className="border-t border-blue-100 bg-white px-5 py-4">
      <div className="grid gap-4 md:grid-cols-4">
        <SmallInfo label="Descricao" value={task.description ?? "Sem detalhamento cadastrado."} />
        <SmallInfo label="Nivel EDT" value={String(task.outlineLevel ?? "-")} />
        <SmallInfo label="Dependencias" value={dependencies || "Sem predecessoras"} />
        <SmallInfo label="Prioridade" value={priorityPt(task.priority)} />
        <SmallInfo label="Duracao planejada" value={`${task.plannedDuration ?? 0} dias`} />
        <SmallInfo label="Inicio real" value={formatDate(task.actualStart)} />
        <SmallInfo label="Duracao real" value={task.actualDuration ? `${task.actualDuration} dias` : "-"} />
        <SmallInfo label="Motivo de atraso" value={task.delayReason ?? "-"} />
      </div>
    </div>
  );
}

function sortTasksForEdt(tasks: any[]) {
  return [...tasks].sort((a, b) => compareWbs(a.wbsCode, b.wbsCode) || new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());
}

function compareWbs(a?: string | null, b?: string | null) {
  const aParts = String(a ?? "999999").split(".").map((part) => Number(part) || 0);
  const bParts = String(b ?? "999999").split(".").map((part) => Number(part) || 0);
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (aParts[index] ?? 0) - (bParts[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function buildTaskTree(tasks: any[]) {
  const nodes = new Map(tasks.map((task) => [task.id, { task, children: [] as any[] }]));
  const roots: any[] = [];
  for (const task of tasks) {
    const node = nodes.get(task.id)!;
    const parent = task.parentTaskId ? nodes.get(task.parentTaskId) : parentNodeByWbs(nodes, task.wbsCode);
    if (parent && parent.task.id !== task.id) parent.children.push(node);
    else roots.push(node);
  }
  const sortNodes = (items: any[]) => {
    items.sort((a, b) => compareWbs(a.task.wbsCode, b.task.wbsCode));
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);
  return roots;
}

function parentNodeByWbs(nodes: Map<string, any>, wbs?: string | null) {
  if (!wbs?.includes(".")) return null;
  const parentWbs = wbs.split(".").slice(0, -1).join(".");
  return [...nodes.values()].find((node) => node.task.wbsCode === parentWbs) ?? null;
}

function TodosModule({ project }: { project: any }) {
  return (
    <ModulePage eyebrow="To-do" title="Controle operacional de proximas acoes" description="Semaforo, prioridade, responsavel, prazo, progresso e horas por item de acompanhamento.">
      <Panel title="Lista de to-dos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="py-3">Semaforo</th><th>ID</th><th>Origem</th><th>Descricao</th><th>Responsavel</th><th>Prioridade</th><th>Status</th><th>Data limite</th><th>Avanco</th><th>Horas</th><th>Proxima acao</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {project.todos.map((todo: any) => <tr key={todo.id}><td className="py-3"><span className={`inline-flex h-3 w-3 rounded-full ${todo.trafficLight === "RED" ? "bg-red-500" : todo.trafficLight === "YELLOW" ? "bg-amber-400" : "bg-emerald-500"}`} /></td><td className="font-black">{todo.code ?? "-"}</td><td>{todo.origin}</td><td>{todo.description}</td><td>{todo.responsible ?? "-"}</td><td>{priorityPt(todo.priority)}</td><td>{todoStatusPt(todo.status)}</td><td>{formatDate(todo.dueDate)}</td><td>{Number(todo.plannedProgress)}% / {Number(todo.actualProgress)}%</td><td>{formatHours(todo.workedHours)} / {formatHours(todo.estimatedHours)}</td><td>{todo.nextAction ?? "-"}</td></tr>)}
            </tbody>
          </table>
        </div>
        {!project.todos.length ? <Empty label="Nenhum to-do cadastrado." /> : null}
      </Panel>
    </ModulePage>
  );
}

function RisksModule({ project }: { project: any }) {
  const riskData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((name) => ({ name: riskClassPt(name), value: project.risks.filter((risk: any) => risk.classification === name).length }));
  const critical = project.risks.filter((risk: any) => risk.classification === "CRITICAL").length;
  const high = project.risks.filter((risk: any) => risk.classification === "HIGH").length;
  const escalations = project.risks.filter((risk: any) => ["CRITICAL", "HIGH"].includes(risk.classification)).length;
  return (
    <ModulePage eyebrow="Riscos" title="Matriz de riscos" description="Riscos com causa, evento, estrategia, contingencia, gatilhos e responsaveis.">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Riscos cadastrados" value={project.risks.length} tone="blue" />
        <Metric label="Riscos criticos" value={critical} tone="red" />
        <Metric label="Riscos altos" value={high} tone="amber" />
        <Metric label="Escalonamento" value={escalations} tone="slate" />
      </div>
      <FilterStrip search="Pesquisar por descricao, causa, responsavel, categoria ou gatilho..." selects={["Todas as categorias", "Todas as classificacoes", "Todos os status"]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {project.risks.map((risk: any, index: number) => <RiskCard key={risk.id} risk={risk} index={index} />)}
          {!project.risks.length ? <Empty label="Nenhum risco cadastrado." /> : null}
        </div>
        <Panel title="Distribuicao por criticidade"><ExecutiveBarChart data={riskData} bars={[{ key: "value", color: "#f97316" }]} /></Panel>
      </div>
    </ModulePage>
  );
}

function BlockersModule({ project }: { project: any }) {
  const open = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED").length;
  return (
    <ModulePage eyebrow="Bloqueios" title="Bloqueios e impedimentos" description="Bloqueios com responsaveis, impacto, data alvo, dias em aberto e proxima acao.">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Bloqueios" value={project.blockers.length} tone="blue" />
        <Metric label="Abertos" value={open} tone={open ? "amber" : "green"} />
        <Metric label="Resolvidos" value={project.blockers.filter((blocker: any) => blocker.status === "RESOLVED").length} tone="green" />
      </div>
      <Panel title="Bloqueios e impedimentos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="py-3">Bloqueio</th><th>Status</th><th>Empresa resp.</th><th>Pessoa resp.</th><th>Data alvo</th><th>Dias aberto</th><th>Impacto</th><th>Proxima acao</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {project.blockers.map((blocker: any) => <tr key={blocker.id}><td className="py-3 font-black">{blocker.title}</td><td>{blockerStatusPt(blocker.status)}</td><td>{blocker.responsibleCompany ?? "-"}</td><td>{blocker.responsiblePerson ?? "-"}</td><td>{formatDate(blocker.expectedResolutionAt)}</td><td>{daysOpen(blocker.openedAt, blocker.resolvedAt)}</td><td>{blocker.impactDescription ?? `${blocker.scheduleImpactDays} dias`}</td><td>{blocker.nextAction ?? "-"}</td></tr>)}
            </tbody>
          </table>
        </div>
        {!project.blockers.length ? <Empty label="Nenhum bloqueio cadastrado." /> : null}
      </Panel>
    </ModulePage>
  );
}

function RiskCard({ risk, index }: { risk: any; index: number }) {
  const probability = risk.probability === "HIGH" ? 4 : risk.probability === "MEDIUM" ? 3 : 2;
  const impact = risk.classification === "CRITICAL" ? 4 : risk.classification === "HIGH" ? 4 : risk.classification === "MEDIUM" ? 3 : 2;
  const exposure = probability * impact;
  const tone = risk.classification === "CRITICAL" ? "border-l-red-500" : risk.classification === "HIGH" ? "border-l-orange-500" : "border-l-blue-500";
  return (
    <div className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 text-sm shadow-lg ${tone}`}>
      <div className="flex items-start justify-between gap-3"><span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-black text-[#063eb3]">R-{String(index + 1).padStart(3, "0")}</span><span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-orange-800">{riskClassPt(risk.classification)}</span></div>
      <h3 className="mt-4 text-base font-black leading-6 text-slate-950">{risk.name}</h3>
      <p className="mt-3 leading-6 text-slate-600">{risk.description ?? risk.event ?? "Risco do projeto"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <RiskScore label="Probabilidade" value={probability} />
        <RiskScore label="Impacto" value={impact} />
        <RiskScore label="Exposicao" value={exposure} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5">
        <p><strong>Categoria:</strong> {risk.category ?? "Projeto"}</p>
        <p><strong>Responsavel:</strong> {risk.owner ?? "-"}</p>
        <p><strong>Status:</strong> {riskStatusPt(risk.status)}</p>
        <p><strong>Prazo da acao:</strong> {formatDate(risk.lastReviewAt)}</p>
        <p><strong>Escalar?</strong> {["CRITICAL", "HIGH"].includes(risk.classification) ? "Sim" : "Nao"}</p>
      </div>
      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-black text-[#005b9f]">Ver detalhes do risco</summary>
        <div className="mt-3 grid gap-2">
          <SmallInfo label="Data de registro" value={formatDate(risk.registeredAt)} />
          <SmallInfo label="Causa" value={risk.cause} />
          <SmallInfo label="Evento" value={risk.event} />
          <SmallInfo label="Estrategia de resposta" value={strategyPt(risk.responseStrategy)} />
          <SmallInfo label="Acoes preventivas" value={risk.preventiveActions} />
          <SmallInfo label="Plano de contingencia" value={risk.contingencyPlan} />
          <SmallInfo label="Gatilhos" value={risk.triggers} />
          <SmallInfo label="Ultima revisao" value={formatDate(risk.lastReviewAt)} />
        </div>
      </details>
    </div>
  );
}

function RiskScore({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>;
}

function FilterStrip({ search, selects, button }: { search: string; selects: string[]; button?: string }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#062553]">Filtros de acompanhamento</h3>
          <p className="text-xs text-slate-500">Refine a visao por texto, responsavel, status, categoria ou tipo.</p>
        </div>
        {button ? <button className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-[#06326e]">{button}</button> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input readOnly value="" placeholder={search} className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none lg:col-span-2" />
        {selects.map((select) => <select key={select} className="h-11 rounded-xl border border-slate-300 px-3 text-sm"><option>{select}</option></select>)}
      </div>
    </section>
  );
}

function HeroDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}

function DashboardModule({ project }: { project: any }) {
  const delayedTasks = project.tasks.filter((task: any) => task.status !== "DONE" && task.plannedEnd < new Date()).length;
  const criticalRisks = project.risks.filter((risk: any) => risk.classification === "CRITICAL" || risk.classification === "HIGH").length;
  const openBlockers = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED").length;
  const statusData = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].map((name) => ({ name: statusPt(name), value: project.tasks.filter((task: any) => task.status === name).length }));
  const progressData = project.milestones.map((milestone: any, index: number) => ({ name: `M${index + 1}`, planejado: Math.min(100, (index + 1) * (100 / Math.max(project.milestones.length, 1))), real: milestone.status === "COMPLETED" ? Math.min(100, (index + 1) * (100 / Math.max(project.milestones.length, 1))) : Number(project.progressPercent) }));

  return (
    <ModulePage eyebrow="Dashboard" title="Sala de controle executiva" description="Numeros consolidados para tomada de decisao: cronograma, horas, riscos, bloqueios, marcos, to-dos, stakeholders e documentos.">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Avanco" value={`${Number(project.progressPercent)}%`} tone="blue" detail="real consolidado" />
        <Metric label="Atividades atrasadas" value={delayedTasks} tone={delayedTasks ? "red" : "green"} />
        <Metric label="Riscos altos/criticos" value={criticalRisks} tone={criticalRisks ? "red" : "green"} />
        <Metric label="Bloqueios abertos" value={openBlockers} tone={openBlockers ? "amber" : "green"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Atividades por status"><MiniPieChart data={statusData} /></Panel>
        <Panel title="Curva planejado x real" className="lg:col-span-2"><ProgressLineChart data={progressData} /></Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Indicadores de horas"><Metric label="Planejadas" value={formatHours(project.plannedHours)} /><div className="mt-3"><Metric label="Executadas" value={formatHours(project.actualHours)} tone="green" /></div><div className="mt-3"><Metric label="Restantes" value={formatHours(project.remainingHours)} tone="amber" /></div></Panel>
        <Panel title="Riscos" className="lg:col-span-1"><div className="grid gap-2">{project.risks.slice(0, 4).map((risk: any) => <div key={risk.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{risk.name}</strong><p className="text-xs text-red-700">{riskClassPt(risk.classification)}</p></div>)}</div></Panel>
        <Panel title="Marcos" className="lg:col-span-1"><div className="grid gap-2">{project.milestones.filter((item: any) => item.status !== "COMPLETED").slice(0, 4).map((milestone: any) => <div key={milestone.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{milestone.name}</strong><p className="text-xs text-slate-500">{formatDate(milestone.plannedDate)}</p></div>)}</div></Panel>
      </div>
    </ModulePage>
  );
}

function SmallInfo({ label, value }: { label: string; value: unknown }) {
  return <p className="rounded-xl bg-white px-3 py-2 text-xs"><span className="font-black text-slate-500">{label}: </span>{String(value ?? "-")}</p>;
}

function statusPt(status: string) {
  return ({ TODO: "A fazer", IN_PROGRESS: "Em andamento", IN_REVIEW: "Em validacao", BLOCKED: "Bloqueado", DONE: "Concluido", PLANNED: "Planejado", COMPLETED: "Concluido", DELAYED: "Atrasado" } as Record<string, string>)[status] ?? status;
}

function todoStatusPt(status: string) {
  return ({ OPEN: "Aberto", IN_PROGRESS: "Em andamento", DONE: "Concluido", CANCELED: "Cancelado" } as Record<string, string>)[status] ?? status;
}

function blockerStatusPt(status: string) {
  return ({ OPEN: "Aberto", IN_PROGRESS: "Em tratamento", RESOLVED: "Resolvido", CANCELED: "Cancelado" } as Record<string, string>)[status] ?? status;
}

function riskStatusPt(status: string) {
  return ({ OPEN: "Aberto", IN_TREATMENT: "Em tratamento", MATERIALIZED: "Materializado", CLOSED: "Encerrado" } as Record<string, string>)[status] ?? status;
}

function priorityPt(priority: string) {
  return ({ LOW: "Baixa", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Critica" } as Record<string, string>)[priority] ?? priority;
}

function riskClassPt(classification: string) {
  return ({ LOW: "Baixo", MEDIUM: "Medio", HIGH: "Alto", CRITICAL: "Critico" } as Record<string, string>)[classification] ?? classification;
}

function levelPt(level: string) {
  return ({ LOW: "Baixa", MEDIUM: "Media", HIGH: "Alta" } as Record<string, string>)[level] ?? level;
}

function stakeholderTypePt(type: string) {
  return ({ INTERNAL: "Interno", CLIENT: "Cliente", PARTNER: "Parceiro", SUPPLIER: "Fornecedor", SPONSOR: "Patrocinador" } as Record<string, string>)[type] ?? type;
}

function strategyPt(strategy: string) {
  return ({ MITIGATE: "Mitigar", ACCEPT: "Aceitar", TRANSFER: "Transferir", AVOID: "Evitar" } as Record<string, string>)[strategy] ?? strategy;
}

function getProjectHealth(project: any) {
  const delayed = project.tasks.filter((task: any) => task.status !== "DONE" && task.plannedEnd < new Date()).length;
  const criticalRisks = project.risks.filter((risk: any) => risk.classification === "CRITICAL").length;
  const openBlockers = project.blockers.filter((blocker: any) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED").length;
  if (criticalRisks || openBlockers > 1 || delayed > 3) return { label: "Critica", tone: "text-red-200" };
  if (openBlockers || delayed || project.risks.some((risk: any) => risk.classification === "HIGH")) return { label: "Atencao", tone: "text-amber-200" };
  return { label: "Saudavel", tone: "text-emerald-200" };
}

function countBy(items: any[], key: string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? "Nao informado");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function daysOpen(openedAt: Date | string, resolvedAt?: Date | string | null) {
  const start = new Date(openedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  return Math.max(0, Math.ceil((end - start) / 86_400_000));
}
