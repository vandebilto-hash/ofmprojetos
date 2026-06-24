import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Flag,
  GitBranch,
  Home,
  Mail,
  Milestone,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { EdtExpandControls } from "@/features/portal/edt-expand-controls";
import { DocumentsModule } from "@/features/portal/portal-documents-module";
import { ExecutiveBarChart, MiniPieChart, ProgressLineChart, StatusCurveChart } from "@/features/portal/public-portal-charts";
import { StatusReportFilters, StatusReportTableFilters, StatusReportTablePager } from "@/features/portal/status-report-controls";
import { getCompanyBadgeClass, getCompanyLabel } from "@/lib/company-colors";
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
  documents: "from-cyan-500 to-blue-800",
  milestones: "from-amber-400 to-orange-700",
  planning: "from-blue-500 to-slate-800",
  risks: "from-red-500 to-rose-800",
  blockers: "from-orange-500 to-red-800",
  dashboard: "from-slate-700 to-slate-950",
};

const moduleIcon: Record<string, React.ElementType> = {
  home: Home,
  governance: Users,
  documents: FileText,
  milestones: Milestone,
  planning: CalendarDays,
  risks: ShieldAlert,
  blockers: AlertOctagon,
  dashboard: BarChart3,
};

const navigationGroups = [
  { label: "Visão geral", keys: ["home", "milestones"] },
  { label: "Governança", keys: ["governance"] },
  { label: "Documentos", keys: ["documents"] },
  { label: "Planejamento", keys: ["planning"] },
  { label: "Riscos e Bloqueios", keys: ["risks", "blockers"] },
];

const groupNavIcon: Record<string, React.ElementType> = {
  "Visão geral": Home,
  Governança: GitBranch,
  Documentos: FileText,
  Planejamento: CalendarDays,
  "Riscos e Bloqueios": AlertTriangle,
};

export function PublicPortalShell({ token, project, modules, activeModule, children }: PublicPortalShellProps) {
  const health = getProjectHealth(project);
  const groupedNavigation = getNavigationGroups(modules);
  const dashboardModule = modules.find((m) => m.key === "dashboard");
  const projectProgress = clamp(Number(project.progressPercent ?? 0), 0, 100);
  const progress = projectProgress;

  return (
    <main className="min-h-screen bg-[#f0f4f9] text-slate-900">
      {/* ── Header ── */}
      <header className="relative min-h-[260px] overflow-hidden bg-[#062553] text-white">
        <div className={`absolute inset-0 bg-gradient-to-br ${moduleTone[activeModule] ?? moduleTone.dashboard} opacity-40`} />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,31,84,.97),rgba(0,67,128,.72),rgba(255,255,255,.06))]" />
        <div className="absolute inset-0 opacity-[.14] [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_28%),linear-gradient(135deg,transparent_0_48%,white_49%_50%,transparent_51%_100%)]" />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-[1360px] px-4 py-4 md:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4">
            <Link href={`/p/${token}`} className="text-base font-black tracking-tight">
              OFM Systems
            </Link>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-2 md:flex" aria-label="Módulos do portal">
              {dashboardModule ? (
                <HeaderNavLink token={token} module={dashboardModule} active={activeModule === "dashboard"} />
              ) : null}
              {groupedNavigation.map((group) => (
                <DropdownNavGroup key={group.label} token={token} group={group} activeModule={activeModule} />
              ))}
            </nav>
          </div>

          {/* Hero */}
          <div className="mx-auto mt-10 max-w-5xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300/90">
              Portal PGP · Governança de Projetos
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{project.name}</h1>
            <p className="mt-2 text-sm font-semibold italic text-white/75">{project.client.name}</p>
          </div>

          {/* Hero KPIs */}
          <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-4">
            <HeroMetric label="Saúde" value={health.label} tone={health.tone} icon={CheckCircle2} />
            <HeroMetric label="Avanço" value={`${Math.round(progress)}%`} icon={TrendingUp} progress={progress} />
            <HeroMetric label="Prazo" value={formatDate(project.currentEnd ?? project.plannedEnd)} icon={CalendarCheck} />
            <HeroMetric
              label="Bloqueios"
              value={project.blockers.filter((b: any) => b.status !== "RESOLVED").length}
              icon={AlertOctagon}
              tone={project.blockers.filter((b: any) => b.status !== "RESOLVED").length > 0 ? "text-red-200" : "text-emerald-200"}
            />
          </div>
        </div>
      </header>

      {/* ── Mobile nav: chips scrolláveis ── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/96 shadow-sm backdrop-blur md:hidden">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {dashboardModule ? (
            <MobileNavChip token={token} moduleKey={dashboardModule.key} label={dashboardModule.label} active={activeModule === "dashboard"} />
          ) : null}
          {groupedNavigation.flatMap((group) =>
            group.items.map((item) => (
              <MobileNavChip key={item.key} token={token} moduleKey={item.key} label={item.label} active={activeModule === item.key} />
            )),
          )}
        </div>
      </div>

      <section className="mx-auto max-w-[1360px] px-4 py-7 md:px-8">{children}</section>
    </main>
  );
}

function MobileNavChip({ token, moduleKey, label, active }: { token: string; moduleKey: string; label: string; active: boolean }) {
  const Icon = moduleIcon[moduleKey] ?? Home;
  return (
    <Link
      href={`/p/${token}/${moduleKey}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "bg-[#062553] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}

function HeaderNavLink({ token, module, active }: { token: string; module: PublicPortalModuleLink; active: boolean }) {
  const Icon = moduleIcon[module.key] ?? BarChart3;
  return (
    <Link
      href={`/p/${token}/${module.key}`}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold shadow-sm ring-1 ring-white/15 transition ${
        active ? "bg-white text-[#062553]" : "bg-white/10 text-white/90 hover:bg-white/16 hover:text-white"
      }`}
    >
      <Icon size={13} />
      {module.label}
    </Link>
  );
}

function getNavigationGroups(modules: PublicPortalModuleLink[]) {
  const byKey = new Map(modules.map((m) => [m.key, m]));
  return navigationGroups
    .map((g) => ({ label: g.label, items: g.keys.map((k) => byKey.get(k)).filter(Boolean) as PublicPortalModuleLink[] }))
    .filter((g) => g.items.length > 0);
}

function DropdownNavGroup({
  token,
  group,
  activeModule,
}: {
  token: string;
  group: { label: string; items: PublicPortalModuleLink[] };
  activeModule: string;
}) {
  const active = group.items.some((i) => i.key === activeModule);
  const GroupIcon = groupNavIcon[group.label] ?? Home;
  const single = group.items.length === 1 ? group.items[0] : null;

  if (single) {
    return (
      <Link
        href={`/p/${token}/${single.key}`}
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold shadow-sm ring-1 ring-white/15 transition ${
          active ? "bg-white text-[#062553]" : "bg-white/10 text-white/90 hover:bg-white/16 hover:text-white"
        }`}
      >
        <GroupIcon size={13} />
        {group.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold shadow-sm ring-1 ring-white/15 transition ${
          active ? "bg-white text-[#062553]" : "bg-white/10 text-white/90 hover:bg-white/16 hover:text-white"
        }`}
      >
        <GroupIcon size={13} />
        {group.label}
        <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </button>
      <div className="invisible absolute right-0 top-full z-50 w-72 pt-3 opacity-0 transition delay-150 duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 group-hover:delay-0">
        <div className="rounded-2xl border border-slate-100 bg-white p-2 text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,.22)]">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
          {group.items.map((item) => {
            const ItemIcon = moduleIcon[item.key] ?? Home;
            return (
              <Link
                key={item.key}
                href={`/p/${token}/${item.key}`}
                className={`group/item flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  item.key === activeModule ? "bg-blue-50 text-[#06326e]" : "text-slate-700 hover:bg-slate-50 hover:text-[#06326e]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ItemIcon size={15} className={item.key === activeModule ? "text-[#06326e]" : "text-slate-400 group-hover/item:text-[#06326e]"} />
                  {item.label}
                </span>
                <span className="text-slate-300 transition group-hover/item:translate-x-0.5 group-hover/item:text-[#06326e]">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  tone,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string | number;
  tone?: string;
  icon?: React.ElementType;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{label}</p>
        {Icon ? <Icon size={14} className="text-white/40" /> : null}
      </div>
      <p className={`mt-2 text-xl font-black ${tone ?? "text-white"}`}>{value}</p>
      {progress !== undefined ? (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PublicPortalModule({ moduleKey, project }: { moduleKey: string; project: any }) {
  if (moduleKey === "home") return <HomeModule project={project} />;
  if (moduleKey === "governance") return <GovernanceModule project={project} />;
  if (moduleKey === "documents") return <DocumentsModule project={project} />;
  if (moduleKey === "milestones") return <MilestonesModule project={project} />;
  if (moduleKey === "planning") return <PlanningModule project={project} />;
  if (moduleKey === "risks") return <RisksModule project={project} />;
  if (moduleKey === "blockers") return <BlockersModule project={project} />;
  return <DashboardModule project={project} />;
}

// ─── Layout primitives ─────────────────────────────────────────────────────

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
        {/* Top gradient accent */}
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
  detail,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  detail?: string;
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
      {detail ? <p className={`mt-1 pl-1.5 text-xs font-semibold opacity-60 ${cfg.text}`}>{detail}</p> : null}
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

// ─── Modules ───────────────────────────────────────────────────────────────

function HomeModule({ project }: { project: any }) {
  return (
    <ModulePage
      eyebrow="Home"
      icon={Home}
      title="Contexto executivo do projeto"
      description={project.home?.mission ?? project.description ?? "Missão do projeto não cadastrada."}
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Proposta e escopo">
          <div className="grid gap-4">
            <InfoBlock title="Sobre o cliente" text={project.home?.clientOverview ?? project.client.name} />
            <InfoBlock title="Proposta" text={project.home?.proposal ?? "Proposta ainda não cadastrada."} />
            <InfoBlock title="Escopo" text={project.home?.scope ?? "Escopo ainda não cadastrado."} />
          </div>
        </Panel>
        <Panel title="Parceiros e frentes envolvidas">
          <div className="grid gap-3">
            {project.partners.map((partner: any, i: number) => {
              const colors = ["bg-blue-500","bg-violet-500","bg-teal-500","bg-indigo-500","bg-cyan-500"];
              const initials = partner.name.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase();
              return (
                <div key={partner.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,.04)] transition-shadow hover:shadow-md">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="h-10 w-10 shrink-0 rounded-lg object-contain" />
                  ) : (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${colors[i % colors.length]}`}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{partner.name}</p>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${partner.type === "CLIENT" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                        {partner.type === "CLIENT" ? "Cliente" : "Parceiro Técnico"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{partner.description ?? "Parceiro do projeto"}</p>
                  </div>
                </div>
              );
            })}
            {!project.partners.length ? <Empty label="Nenhum parceiro cadastrado." icon={Users} /> : null}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-l-[3px] border-slate-100 border-l-blue-400 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function GovernanceModule({ project }: { project: any }) {
  const quadrants = [
    ["HIGH", "HIGH", "Gerenciar de perto", "red"],
    ["HIGH", "LOW", "Manter satisfeito", "amber"],
    ["LOW", "HIGH", "Manter informado", "blue"],
    ["LOW", "LOW", "Monitorar", "slate"],
  ];

  return (
    <ModulePage
      eyebrow="Governança"
      icon={GitBranch}
      title="Mapa de stakeholders e governança"
      description="Visão analítica de influência, interesse, papel no projeto e estratégia de relacionamento."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Panel title="Mapa influência × interesse">
          <div className="grid gap-3 md:grid-cols-2">
            {quadrants.map(([influence, interest, label, tone]) => {
              const items = project.stakeholders.filter((s: any) => s.influence === influence && s.interest === interest);
              return (
                <div
                  key={`${influence}-${interest}`}
                  className={`min-h-40 rounded-xl border p-4 ${
                    tone === "red"
                      ? "border-red-100 bg-red-50/60"
                      : tone === "amber"
                        ? "border-amber-100 bg-amber-50/60"
                        : tone === "blue"
                          ? "border-blue-100 bg-blue-50/60"
                          : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm font-black ${
                      tone === "red"
                        ? "text-red-700"
                        : tone === "amber"
                          ? "text-amber-700"
                          : tone === "blue"
                            ? "text-blue-700"
                            : "text-slate-700"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Influência {levelPt(String(influence))} · Interesse {levelPt(String(interest))}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((s: any) => (
                      <span key={s.id} className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                        <span>{s.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCompanyBadgeClass(s.company)}`}>{getCompanyLabel(s.company)}</span>
                      </span>
                    ))}
                    {!items.length ? <span className="text-xs text-slate-400">Sem stakeholders</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <Panel title="Cadastro de stakeholders">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="py-3">Nome</th>
                <th>Empresa</th>
                <th>Papel</th>
                <th>Tipo</th>
                <th>Influência</th>
                <th>Interesse</th>
                <th>Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {project.stakeholders.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 font-bold">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{s.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCompanyBadgeClass(s.company)}`}>{getCompanyLabel(s.company)}</span>
                    </span>
                  </td>
                  <td className="text-slate-600">{s.company ?? "-"}</td>
                  <td className="text-slate-600">{s.projectRole ?? s.jobTitle ?? "-"}</td>
                  <td className="text-slate-600">{stakeholderTypePt(s.type)}</td>
                  <td className="text-slate-600">{levelPt(s.influence)}</td>
                  <td className="text-slate-600">{levelPt(s.interest)}</td>
                  <td className="text-slate-600">{s.classification ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </ModulePage>
  );
}

function MilestonesModule({ project }: { project: any }) {
  const now = new Date();
  const milestones = project.milestones ?? [];
  const milestoneRollup = milestoneStatusRollup(milestones, now);

  return (
    <ModulePage
      eyebrow="Marcos do projeto"
      icon={Milestone}
      title="Timeline executiva dos marcos"
      description="Principais entregas, aprovações, decisões e eventos do projeto."
    >
      <Panel title="Semáforo de Marcos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MilestoneRollupCard label="Total" value={milestoneRollup.total} detail={`${milestoneRollup.progress}% de avanço`} tone="slate" />
          <MilestoneRollupCard label="Concluídos" value={milestoneRollup.done} detail={`${milestoneRollup.donePct}% dos marcos`} tone="green" />
          <MilestoneRollupCard label="Atenção" value={milestoneRollup.attention} detail="em andamento/no prazo" tone="amber" />
          <MilestoneRollupCard label="Atrasados" value={milestoneRollup.late} detail="fora da previsão" tone="red" />
        </div>
      </Panel>
      <Panel>
        <div className="overflow-x-auto pb-4">
          <div className="relative flex min-w-[900px] items-start justify-between gap-4 px-8 pt-6 before:absolute before:left-14 before:right-14 before:top-[27px] before:h-[3px] before:rounded-full before:bg-gradient-to-r before:from-blue-300 before:via-blue-500 before:to-blue-300">
            {milestones.map((milestone: any) => {
              const isDone = milestone.status === "COMPLETED";
              const isLate = !isDone && new Date(milestone.plannedDate) < new Date();
              const circleClass = isDone
                ? "border-emerald-200 bg-emerald-500"
                : isLate
                  ? "border-red-200 bg-red-500"
                  : "border-blue-200 bg-[#063eb3]";
              const cardBorder = isDone
                ? "border-emerald-100"
                : isLate
                  ? "border-red-100"
                  : "border-blue-100";
              const statusLabel = isDone ? "Concluído" : isLate ? "Atrasado" : statusPt(milestone.status);
              const statusChip = isDone
                ? "bg-emerald-100 text-emerald-700"
                : isLate
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-50 text-blue-700";
              return (
                <div key={milestone.id} className="relative z-10 flex w-36 flex-col items-center text-center">
                  {/* Circle on timeline */}
                  <div className={`flex h-[54px] w-[54px] items-center justify-center rounded-full border-[5px] shadow-lg ${circleClass}`}>
                    <Flag size={20} className="text-white" />
                  </div>
                  {/* Card */}
                  <div className={`mt-4 w-full rounded-xl border bg-white p-4 shadow-md ${cardBorder}`}>
                    <p className="font-black leading-snug text-slate-900">{milestone.name}</p>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">{milestone.description ?? milestone.type ?? "Marco do projeto"}</p>
                    <p className="mt-2 text-[11px] font-bold text-slate-400">{formatDate(milestone.plannedDate)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusChip}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
            {!milestones.length ? (
              <div className="w-full"><Empty label="Nenhum marco cadastrado." icon={Milestone} /></div>
            ) : null}
          </div>
        </div>
      </Panel>
    </ModulePage>
  );
}

function PlanningModule({ project }: { project: any }) {
  const tasks = sortTasksForEdt(project.tasks ?? []);
  const taskTree = buildTaskTree(tasks);
  const done = tasks.filter((t: any) => t.status === "DONE").length;
  const delayed = tasks.filter((t: any) => t.status !== "DONE" && t.plannedEnd < new Date()).length;
  const statusData = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].map((s) => ({
    name: statusPt(s),
    value: tasks.filter((t: any) => t.status === s).length,
  }));
  const hoursData = tasks.slice(0, 8).map((t: any) => ({
    name: truncate(t.name, 18),
    planejadas: Number(t.estimatedHours),
    executadas: Number(t.actualHours),
  }));

  return (
    <ModulePage
      eyebrow="Planejamento"
      icon={CalendarDays}
      title="Cronograma, EDT e análise de horas"
      description="Visão executiva do cronograma com acompanhamento de avanços, horas e desvios."
    >
      <section className="rounded-2xl bg-gradient-to-br from-[#062553] to-[#2457d6] p-6 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Portal PGP · Governança de Projetos</p>
        <h3 className="mt-2 text-2xl font-black">Cronograma Executivo do Projeto</h3>
        <p className="mt-1.5 max-w-4xl text-sm font-medium text-white/80">
          Visão integrada do cronograma com EDT, atividades, responsáveis, prazos, horas planejadas, horas executadas, avanço, marcos e semáforo gerencial.
        </p>
        <div className="mt-5 rounded-xl border border-white/15 bg-white/10 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Sincronizado automaticamente
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <HeroDetail label="Início do projeto" value={formatDate(project.plannedStart)} />
            <HeroDetail label="Fim planejado" value={formatDate(project.plannedEnd)} />
            <HeroDetail
              label="Responsáveis"
              value={String(new Set(project.tasks.map((t: any) => t.owner?.name).filter(Boolean)).size)}
            />
            <HeroDetail label="Última atualização" value={new Date().toLocaleString("pt-BR")} />
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Atividades" value={tasks.length} detail={`${done} concluídas`} tone="blue" />
        <Metric label="Atrasadas" value={delayed} tone={delayed ? "red" : "green"} />
        <Metric label="Horas planejadas" value={formatHours(project.plannedHours)} tone="slate" />
        <Metric label="Horas executadas" value={formatHours(project.actualHours)} tone="green" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Atividades por status">
          <MiniPieChart data={statusData} />
        </Panel>
        <Panel title="Horas por pacote EDT">
          <ExecutiveBarChart data={hoursData} bars={[{ key: "planejadas", color: "#2563eb" }, { key: "executadas", color: "#16a34a" }]} />
        </Panel>
      </div>
      <FilterStrip search="Digite parte da descrição, item ou responsável" selects={["Responsável", "Semáforo", "Nível EDT", "Tipo"]} button="Limpar filtros" />
      <Panel title="EDT e cronograma detalhado">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">Pacotes com seta possuem atividades abaixo. Clique na linha para abrir o detalhamento.</p>
          <EdtExpandControls />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1220px] overflow-hidden rounded-xl border border-blue-100 text-xs">
            <div className="grid grid-cols-[64px_300px_116px_90px_108px_90px_112px_112px_70px_86px_70px] bg-[#062553] font-black text-white">
              {["EDT", "Atividade", "Responsável", "Início", "Fim planejado", "Fim real", "H. planejadas", "H. executadas", "Avanço", "Status", "Semáforo"].map((h) => (
                <div key={h} className="px-3 py-4">{h}</div>
              ))}
            </div>
            <div className="divide-y divide-blue-50">
              {taskTree.map((node: any, i: number) => <TaskEdtNode key={node.task.id} node={node} index={i} />)}
            </div>
          </div>
        </div>
        {!tasks.length ? <Empty label="Nenhuma atividade cadastrada no cronograma." icon={CalendarDays} /> : null}
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
    <div
      className={`grid grid-cols-[64px_300px_116px_90px_108px_90px_112px_112px_70px_86px_70px] items-start ${
        hasChildren ? "bg-blue-100/60" : index % 2 === 0 ? "bg-blue-50/40" : "bg-white"
      }`}
    >
      <div className={`px-3 py-4 font-black ${hasChildren ? "text-[#062553]" : "text-[#17406f]"}`}>{task.wbsCode ?? "-"}</div>
      <div className="px-3 py-4 font-semibold text-slate-900" style={{ paddingLeft: `${8 + (level - 1) * 18}px` }}>
        {hasChildren ? (
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#062553] text-[10px] font-black text-white group-open:hidden">+</span>
        ) : (
          <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-blue-300" />
        )}
        {hasChildren ? (
          <span className="mr-2 hidden h-5 w-5 items-center justify-center rounded-full bg-[#062553] text-[10px] font-black text-white group-open:inline-flex">−</span>
        ) : null}
        <span className={hasChildren ? "font-black text-[#062553]" : ""}>{task.name}</span>
        {hasChildren ? (
          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#062553] ring-1 ring-blue-200">
            {node.children.length}
          </span>
        ) : null}
      </div>
      <div className="px-3 py-4 text-slate-600">{task.owner?.name ?? "-"}</div>
      <div className="px-3 py-4 text-slate-600">{formatDate(task.plannedStart)}</div>
      <div className="px-3 py-4 text-slate-600">{formatDate(task.plannedEnd)}</div>
      <div className="px-3 py-4 text-slate-600">{formatDate(task.actualEnd)}</div>
      <div className="px-3 py-4 text-slate-600">{formatHours(task.estimatedHours)}</div>
      <div className="px-3 py-4 text-slate-600">{formatHours(task.actualHours)}</div>
      <div className="px-3 py-4 font-semibold">{Number(task.progressPercent)}%</div>
      <div className="px-3 py-4 text-slate-600">{statusPt(task.status)}</div>
      <div className="px-3 py-4">
        <span
          className={`inline-flex h-3 w-3 rounded-full ${
            task.status === "DONE" ? "bg-emerald-500" : late ? "bg-red-500" : "bg-amber-400"
          }`}
        />
      </div>
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
      <div className="border-t border-blue-50">
        {node.children.map((child: any, i: number) => <TaskEdtNode key={child.task.id} node={child} index={i} />)}
      </div>
    </details>
  );
}

function TaskDetails({ task }: { task: any }) {
  const deps = (task.predecessors ?? [])
    .map((d: any) => `${d.predecessor?.wbsCode ?? "-"} ${d.predecessor?.name ?? ""}`)
    .filter(Boolean)
    .join("; ");
  return (
    <div className="border-t border-blue-50 bg-slate-50 px-5 py-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SmallInfo label="Descrição" value={task.description ?? "Sem detalhamento."} />
        <SmallInfo label="Nível EDT" value={String(task.outlineLevel ?? "-")} />
        <SmallInfo label="Dependências" value={deps || "Sem predecessoras"} />
        <SmallInfo label="Prioridade" value={priorityPt(task.priority)} />
        <SmallInfo label="Duração planejada" value={`${task.plannedDuration ?? 0} dias`} />
        <SmallInfo label="Início real" value={formatDate(task.actualStart)} />
        <SmallInfo label="Duração real" value={task.actualDuration ? `${task.actualDuration} dias` : "-"} />
        <SmallInfo label="Motivo de atraso" value={task.delayReason ?? "-"} />
      </div>
    </div>
  );
}

function RisksModule({ project }: { project: any }) {
  const riskData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((n) => ({
    name: riskClassPt(n),
    value: project.risks.filter((r: any) => r.classification === n).length,
  }));
  const critical = project.risks.filter((r: any) => r.classification === "CRITICAL").length;
  const high = project.risks.filter((r: any) => r.classification === "HIGH").length;
  const escalations = project.risks.filter((r: any) => ["CRITICAL", "HIGH"].includes(r.classification)).length;

  return (
    <ModulePage
      eyebrow="Riscos"
      icon={ShieldAlert}
      title="Matriz de riscos"
      description="Riscos com causa, evento, estratégia, contingência, gatilhos e responsáveis."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Riscos cadastrados" value={project.risks.length} tone="blue" />
        <Metric label="Riscos críticos" value={critical} tone="red" />
        <Metric label="Riscos altos" value={high} tone="amber" />
        <Metric label="Escalonamento" value={escalations} tone={escalations > 0 ? "red" : "green"} />
      </div>
      <FilterStrip search="Pesquisar por descrição, causa, responsável, categoria..." selects={["Todas as categorias", "Todas as classificações", "Todos os status"]} />
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {project.risks.map((risk: any, i: number) => <RiskCard key={risk.id} risk={risk} index={i} />)}
          {!project.risks.length ? (
            <div className="col-span-full"><Empty label="Nenhum risco cadastrado." icon={ShieldAlert} /></div>
          ) : null}
        </div>
        <Panel title="Distribuição por criticidade">
          <ExecutiveBarChart data={riskData} bars={[{ key: "value", color: "#f97316" }]} />
        </Panel>
      </div>
    </ModulePage>
  );
}

function BlockersModule({ project }: { project: any }) {
  const open = project.blockers.filter((b: any) => b.status !== "RESOLVED" && b.status !== "CANCELED");
  const resolved = project.blockers.filter((b: any) => b.status === "RESOLVED");
  const criticalityLabel: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" };
  const criticalityClass: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700"
  };

  return (
    <ModulePage
      eyebrow="Bloqueios"
      icon={AlertOctagon}
      title="Bloqueios e impedimentos"
      description="Bloqueios com responsáveis, impacto, data alvo, dias em aberto e próxima ação."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total de bloqueios" value={project.blockers.length} tone="blue" />
        <Metric label="Em aberto" value={open.length} tone={open.length > 0 ? "red" : "green"} />
        <Metric label="Resolvidos" value={resolved.length} tone="green" />
      </div>

      {/* Cards de bloqueios */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {project.blockers.map((blocker: any) => {
          const isOpen = blocker.status !== "RESOLVED" && blocker.status !== "CANCELED";
          const days = daysOpen(blocker.openedAt, blocker.resolvedAt);
          const borderColor = isOpen && days > 5 ? "border-l-red-500" : isOpen ? "border-l-amber-400" : "border-l-emerald-400";

          return (
            <div key={blocker.id} className={`flex flex-col rounded-xl border border-l-4 border-slate-100 bg-white p-5 shadow-sm ${borderColor}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      isOpen
                        ? days > 5
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {blockerStatusPt(blocker.status)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${criticalityClass[blocker.criticality] ?? criticalityClass.MEDIUM}`}>
                    Criticidade {criticalityLabel[blocker.criticality] ?? criticalityLabel.MEDIUM}
                  </span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                    isOpen && days > 5
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {days}d em aberto
                </span>
              </div>
              <h3 className="mt-3 font-black text-slate-950">{blocker.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-5 text-slate-500">
                {blocker.impactDescription ?? (blocker.scheduleImpactDays ? `Impacto: ${blocker.scheduleImpactDays} dias` : "Sem descrição de impacto")}
              </p>
              <div className="mt-3 grid gap-1 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <p>
                  <strong className="text-slate-700">Empresa resp.:</strong> {blocker.responsibleCompany ?? "-"}
                </p>
                <p>
                  <strong className="text-slate-700">Pessoa resp.:</strong> {blocker.responsiblePerson ?? "-"}
                </p>
                <p>
                  <strong className="text-slate-700">Data alvo:</strong> {formatDate(blocker.expectedResolutionAt)}
                </p>
                {blocker.nextAction ? (
                  <p>
                    <strong className="text-slate-700">Próxima ação:</strong> {blocker.nextAction}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        {!project.blockers.length ? (
          <div className="col-span-full"><Empty label="Nenhum bloqueio cadastrado." icon={AlertOctagon} /></div>
        ) : null}
      </div>
    </ModulePage>
  );
}

// ─── Dashboard / Status Report ─────────────────────────────────────────────

function DashboardModule({ project }: { project: any }) {
  const tasks = sortTasksForEdt(project.tasks ?? []);
  const leafTasks = statusReportLeafTasks(tasks);
  const generatedAt = new Date();
  const now = statusReportReferenceDate(project, leafTasks, generatedAt);
  const progress = clamp(Number(project.progressPercent ?? 0), 0, 100);
  const baseline = activeBaseline(project);
  const plannedProgress = plannedProgressForDate(project, now, baseline, leafTasks);
  const doneTasks = leafTasks.filter((t: any) => t.status === "DONE").length;
  const delayedTasks = leafTasks.filter((t: any) => t.status !== "DONE" && new Date(t.plannedEnd) < now);
  const openBlockers = (project.blockers ?? []).filter((b: any) => b.status !== "RESOLVED" && b.status !== "CANCELED");
  const activeRisks = (project.risks ?? []).filter((r: any) => r.status !== "CLOSED");
  const criticalRisks = activeRisks.filter((r: any) => r.classification === "CRITICAL" || r.classification === "HIGH");
  const phaseTasks = tasks.filter((t: any) => Number(t.outlineLevel ?? 1) <= 2).slice(0, 5);
  const ganttTasks = tasks.length ? tasks : leafTasks;
  const currentActivities = statusReportActivities(leafTasks, now);
  const resourceRows = resourceConsumptionRows(project, leafTasks);
  const riskRows = [
    ...openBlockers.map((b: any) => ({ type: "blocker", item: b })),
    ...activeRisks.map((r: any) => ({ type: "risk", item: r })),
  ];
  const milestoneRows = leafTasks;
  const milestoneRollup = milestoneStatusRollup(milestoneRows, now);
  const executiveSummary = statusExecutiveSummary(project, leafTasks, delayedTasks, openBlockers, progress, plannedProgress);
  const delivered = leafTasks.filter((t: any) => t.status === "DONE" && t.actualEnd && daysBetween(t.actualEnd, now) <= 15).slice(0, 3);
  const nextFocus = leafTasks.filter((t: any) => t.status !== "DONE" && daysBetween(now, t.plannedEnd) <= 15 && new Date(t.plannedEnd) >= startOfDay(now)).slice(0, 3);
  const curveData = statusCurveData(project, leafTasks, baseline, now);
  const health = getProjectHealth(project);
  const scheduleTone = health.label === "Crítica" ? "red" : health.label === "Atenção" ? "amber" : "green";

  // Semáforo executivo
  const scopeInfo = scopeSummary(project, tasks);
  const resourceOverloaded = resourceRows.some((r) => r.planned > 0 && r.actual / r.planned > 1);
  const semaphore = [
    {
      label: "Cronograma",
      tone: scheduleTone,
      detail: health.label,
    },
    {
      label: "Escopo",
      tone: scopeInfo.count > 0 ? "amber" : "green",
      detail: scopeInfo.label,
    },
    {
      label: "Recursos",
      tone: resourceOverloaded ? "red" : "green",
      detail: resourceOverloaded ? "Sobrealocado" : "Dentro da meta",
    },
  ];

  const deviationPct = Math.round(progress) - Math.round(plannedProgress);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 text-[#00143d]">

      {/* ── HEADER ── */}
      <header className="overflow-hidden rounded-2xl shadow-xl">
        <div className="bg-[#0d1f45] px-7 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 size={20} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/80">Status Report Dinâmico v3 · OFM Systems</p>
                <h1 className="text-xl font-black leading-tight">{project.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-white/50">Gerado em {formatDateTime(generatedAt)} · Dados até {formatDate(now)}</p>
              <Link
                href={`/api/export?projectId=${project.id}&format=pdf&reportType=client-executive`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700"
              >
                <Download size={12} />
                PDF
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-[#091630] px-7 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] font-medium text-white/50">
            <span>Cliente: <strong className="text-white/90">{project.client?.name ?? "-"}</strong></span>
            <span className="text-white/20">|</span>
            <span>Gerente: <strong className="text-white/90">{project.manager?.name ?? "—"}</strong></span>
            <span className="text-white/20">|</span>
            <span>Período: <strong className="text-white/90">{formatDate(project.plannedStart)} – {formatDate(project.currentEnd ?? project.plannedEnd)}</strong></span>
            <span className="text-white/20">|</span>
            <span>{businessDays(project.plannedStart, project.currentEnd ?? project.plannedEnd)} dias úteis</span>
            {phaseTasks[0] ? (
              <>
                <span className="text-white/20">|</span>
                <span>Fase atual: <strong className="text-white/90">{phaseTasks[0].name}</strong></span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── 4 KPI CARDS ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Progresso */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1a3a7a] p-5 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200/70">Progresso realizado</p>
          <p className="mt-3 text-5xl font-black leading-none">{Math.round(progress)}<span className="text-2xl">%</span></p>
          <p className="mt-1.5 text-xs font-semibold text-blue-200/60">{doneTasks} de {leafTasks.length} tarefas concluídas</p>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
              <span>Planejado: {Math.round(plannedProgress)}%</span>
              {deviationPct >= 0
                ? <span className="text-emerald-300">+{deviationPct}% adiantado</span>
                : <span className="text-red-300">{deviationPct}% atraso</span>}
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div className="absolute h-full rounded-full bg-white/30" style={{ width: `${plannedProgress}%` }} />
              <div className="absolute h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-300/80">
            <TrendingUp size={13} />
            {deviationPct >= 0 ? "Acima do planejado" : "Abaixo do planejado"}
          </div>
        </div>

        {/* Saúde */}
        {(() => {
          const bg = scheduleTone === "green" ? "bg-emerald-600" : scheduleTone === "amber" ? "bg-amber-500" : "bg-red-600";
          const soft = scheduleTone === "green" ? "text-emerald-100" : scheduleTone === "amber" ? "text-amber-100" : "text-red-100";
          const TrendIcon = scheduleTone === "green" ? CheckCircle2 : scheduleTone === "amber" ? Activity : TrendingDown;
          return (
            <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${bg}`}>
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${soft}/70`}>Saúde do cronograma</p>
              <p className="mt-3 text-4xl font-black leading-none">{health.label}</p>
              <p className={`mt-1.5 text-xs font-semibold ${soft}/60`}>{delayedTasks.length} {delayedTasks.length === 1 ? "tarefa atrasada" : "tarefas atrasadas"}</p>
              <div className={`mt-4 flex items-center gap-1.5 text-[11px] font-semibold ${soft}/80`}>
                <TrendIcon size={13} />
                {scheduleTone === "green" ? "Projeto no prazo" : scheduleTone === "amber" ? "Requer atenção" : "Cronograma crítico"}
              </div>
            </div>
          );
        })()}

        {/* Atrasos */}
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${delayedTasks.length > 0 ? "bg-amber-600" : "bg-slate-600"}`}>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Tarefas atrasadas</p>
          <p className="mt-3 text-5xl font-black leading-none">{delayedTasks.length}</p>
          <p className="mt-1.5 text-xs font-semibold text-white/60">de {leafTasks.length} atividades totais</p>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
            <Clock size={13} />
            {delayedTasks.length === 0 ? "Todas no prazo" : `${Math.round((delayedTasks.length / Math.max(leafTasks.length, 1)) * 100)}% em desvio`}
          </div>
        </div>

        {/* Riscos & Bloqueios */}
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${(criticalRisks.length + openBlockers.length) > 0 ? "bg-red-700" : "bg-slate-600"}`}>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Riscos & bloqueios</p>
          <p className="mt-3 text-5xl font-black leading-none">{criticalRisks.length + openBlockers.length}</p>
          <p className="mt-1.5 text-xs font-semibold text-white/60">{openBlockers.length} bloqueio(s) · {criticalRisks.length} risco(s) crítico(s)</p>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
            <ShieldAlert size={13} />
            {(criticalRisks.length + openBlockers.length) === 0 ? "Sem impedimentos ativos" : "Requer ação imediata"}
          </div>
        </div>
      </section>

      {/* ── SEMÁFORO + BARRA DE PROGRESSO ── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Activity size={12} />
            Semáforo executivo
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {semaphore.map((item) => {
              const cfg = {
                green: { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800", sub: "text-emerald-600", border: "border-emerald-200" },
                amber: { bar: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-800", sub: "text-amber-600", border: "border-amber-200" },
                red: { bar: "bg-red-500", bg: "bg-red-50", text: "text-red-800", sub: "text-red-600", border: "border-red-200" },
              }[item.tone as "green" | "amber" | "red"];
              return (
                <div key={item.label} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${cfg.bar} shadow-sm`} />
                    <p className={`text-sm font-black ${cfg.text}`}>{item.label}</p>
                  </div>
                  <p className={`mt-1.5 text-xs font-semibold ${cfg.sub}`}>{item.detail}</p>
                  <div className={`mt-3 h-1.5 w-full overflow-hidden rounded-full ${cfg.bg} ring-1 ${cfg.border}`}>
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: item.tone === "green" ? "100%" : item.tone === "amber" ? "50%" : "25%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-[240px] flex-col justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Desvio do planejado</p>
          <p className={`mt-2 text-5xl font-black leading-none ${deviationPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {deviationPct >= 0 ? "+" : ""}{deviationPct}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {Math.round(progress)}% real vs. {Math.round(plannedProgress)}% planejado
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
            {deviationPct >= 0
              ? <><TrendingUp size={14} className="text-emerald-500" /><span className="text-emerald-600">Adiantado</span></>
              : <><TrendingDown size={14} className="text-red-500" /><span className="text-red-600">Em atraso</span></>}
          </div>
        </div>
      </section>

      <StatusReportFilters />

      {/* ── RESUMO EXECUTIVO + PANORAMA ÁGIL ── */}
      <section className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText size={15} className="text-blue-600" />
            </span>
            <h2 className="text-sm font-black text-slate-900">Resumo Executivo</h2>
          </div>
          <p className="px-6 py-5 text-sm leading-7 text-slate-600">{executiveSummary}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Zap size={15} className="text-violet-600" />
            </span>
            <h2 className="text-sm font-black text-slate-900">Panorama Ágil</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <AgileGroup icon={CheckCheck} tone="green" title="Entregas (últimos 15 dias)" items={delivered.map((t: any) => t.name)} empty="Sem entregas no período." />
            <AgileGroup icon={Target} tone="blue" title="Foco da próxima quinzena" items={nextFocus.map((t: any) => t.name)} empty="Sem atividades programadas." />
            <AgileGroup icon={AlertOctagon} tone="red" title="Bloqueios críticos" items={openBlockers.map((b: any) => `${b.title}${b.responsiblePerson ? ` · ${b.responsiblePerson}` : ""}`)} empty="Sem bloqueios ativos." />
          </div>
        </div>
      </section>

      {/* ── CURVA S ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
            <TrendingUp size={15} className="text-sky-600" />
          </span>
          <h2 className="text-sm font-black text-slate-900">Curva S — Progresso Planejado vs. Progresso Feito</h2>
        </div>
        <div className="overflow-x-auto px-4 pb-4 pt-2">
          <div className="min-w-[680px]">
            <StatusCurveChart data={curveData} />
          </div>
        </div>
      </div>

      {/* ── GANTT ── */}
      {(() => {
        const ganttLabelW = 240;
        const ganttStart = project.plannedStart;
        const ganttEnd = project.currentEnd ?? project.plannedEnd;
        const todayPct = timelinePosition(now, ganttStart, ganttEnd);
        const startLabel = monthYear(ganttStart);
        const midPt = new Date((new Date(ganttStart).getTime() + new Date(ganttEnd).getTime()) / 2);
        const midLabel = monthYear(midPt);
        const endLabel = monthYear(ganttEnd);
        return (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <CalendarDays size={15} className="text-indigo-600" />
                </span>
                <h2 className="text-sm font-black text-slate-900">Cronograma e Avanço por Todas as Atividades (Gantt)</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {startLabel} → {endLabel} · {businessDays(ganttStart, ganttEnd)} dias úteis
              </p>
            </div>
            <div className="overflow-auto px-6 py-5" style={{ maxHeight: 520 }}>
              <div className="min-w-[1100px] space-y-1.5">

                {/* Time-axis header — Hoje lives here, correctly inside the bar area */}
                <div className="flex items-end pb-2">
                  <div className="shrink-0 pr-3" style={{ width: ganttLabelW }} />
                  <div className="relative flex-1">
                    {/* Axis labels */}
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>{startLabel}</span>
                      <span>{midLabel}</span>
                      <span>{endLabel}</span>
                    </div>
                    {/* Thin axis line */}
                    <div className="h-px w-full bg-slate-200" />
                    {/* Hoje marker — correctly within bar area */}
                    <div
                      className="pointer-events-none absolute bottom-0 z-20"
                      style={{ left: `${todayPct}%`, top: 0 }}
                    >
                      <div className="h-full border-l-2 border-dashed border-red-400" style={{ minHeight: 24 }} />
                      <span className="absolute -top-5 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                        Hoje
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gantt rows */}
                <GanttBar
                  label={baseline ? `Planejado (${baseline.name})` : "Progresso Planejado"}
                  start={ganttStart}
                  end={ganttEnd}
                  project={project}
                  progress={plannedProgress}
                  color="bg-blue-700"
                  labelWidth={ganttLabelW}
                />
                {ganttTasks.map((task: any, i: number) => (
                  <GanttBar
                    key={task.id}
                    label={`${task.wbsCode ? `${task.wbsCode} ` : ""}${task.name}`}
                    start={task.plannedStart}
                    end={task.plannedEnd}
                    project={project}
                    progress={Number(task.progressPercent ?? 0)}
                    color={["bg-cyan-500","bg-violet-500","bg-teal-500","bg-indigo-500","bg-blue-400"][i % 5]}
                    labelWidth={ganttLabelW}
                    level={Number(task.outlineLevel ?? 1)}
                    status={task.status}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MARCOS ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Milestone size={15} className="text-amber-600" />
          </span>
          <h2 className="text-sm font-black text-slate-900">Semáforo de Marcos</h2>
        </div>
        <div className="grid gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <MilestoneRollupCard label="Total" value={milestoneRollup.total} detail={`${milestoneRollup.progress}% de avanço`} tone="slate" />
          <MilestoneRollupCard label="Concluídos" value={milestoneRollup.done} detail={`${milestoneRollup.donePct}% das atividades`} tone="green" />
          <MilestoneRollupCard label="Atenção" value={milestoneRollup.attention} detail="em andamento/no prazo" tone="amber" />
          <MilestoneRollupCard label="Atrasados" value={milestoneRollup.late} detail="fora da previsão" tone="red" />
        </div>
        <StatusReportTableFilters tableId="status-report-milestones" />
        <div className="max-h-[520px] overflow-auto">
          <table id="status-report-milestones" className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-6 py-3">Atividade</th>
                <th className="py-3">Previsão</th>
                <th className="py-3">Responsável</th>
                <th className="py-3">H. Planejadas</th>
                <th className="py-3">Status</th>
                <th className="py-3 pr-6">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestoneRows.map((item: any) => <MilestoneReportRow key={item.id} item={item} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ATIVIDADES + RECURSOS (lado a lado) ── */}
      <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
        {/* Atividades */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
              <Clock size={15} className="text-teal-600" />
            </span>
            <h2 className="text-sm font-black text-slate-900">Atividades da Semana</h2>
          </div>
          <div className="overflow-auto max-h-[420px]">
            <table id="status-report-activities" className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-3">Status</th>
                  <th className="py-3">Atividade</th>
                  <th className="py-3">Responsável</th>
                  <th className="py-3 pr-6">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentActivities.map((task: any) => <ActivityReportRow key={task.id} task={task} now={now} />)}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-6 py-3">
            <StatusReportTablePager tableId="status-report-activities" pageSize={10} />
          </div>
        </div>

        {/* Recursos */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
              <Users size={15} className="text-purple-600" />
            </span>
            <h2 className="text-sm font-black text-slate-900">Alocação de Recursos</h2>
          </div>
          <div id="status-report-resources" className="divide-y divide-slate-100 overflow-auto max-h-[420px]">
            {resourceRows.map((row) => <ResourceReportRow key={row.name} row={row} />)}
          </div>
          <div className="border-t border-slate-100 px-6 py-3">
            <StatusReportTablePager tableId="status-report-resources" pageSize={6} />
          </div>
        </div>
      </div>

      {/* ── MATRIZ RISCOS & BLOQUEIOS ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <ShieldAlert size={15} className="text-red-600" />
          </span>
          <h2 className="text-sm font-black text-slate-900">Matriz de Riscos e Bloqueios</h2>
        </div>
        <div className="overflow-auto">
          <table id="status-report-risks" className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-6 py-3">Descrição</th>
                <th className="py-3">Impacto</th>
                <th className="py-3">Nível</th>
                <th className="py-3">Ação planejada</th>
                <th className="py-3 pr-6">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskRows.map((row, i) => <RiskReportRow key={`${row.type}-${row.item.id}`} row={row} index={i} />)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-6 py-3">
          <StatusReportTablePager tableId="status-report-risks" pageSize={8} />
        </div>
      </div>

    </div>
  );
}

// ─── Status Report sub-components ──────────────────────────────────────────

function StatusCard({
  title,
  value,
  detail,
  footer,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  detail?: string;
  footer?: string;
  icon: React.ElementType;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const toneMap = {
    blue: { icon: "bg-blue-100 text-blue-600", value: "text-blue-900", badge: "bg-blue-100 text-blue-700" },
    green: { icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700" },
    amber: { icon: "bg-amber-100 text-amber-600", value: "text-amber-800", badge: "bg-amber-100 text-amber-700" },
    red: { icon: "bg-red-100 text-red-600", value: "text-red-700", badge: "bg-red-100 text-red-700" },
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{title}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap.icon}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className={`mt-3 text-3xl font-black ${toneMap.value}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p> : null}
      {footer ? (
        <p className="mt-4 text-[11px] text-slate-400">
          <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${toneMap.badge}`}>
            {tone === "amber" ? "Atenção" : tone === "red" ? "Crítico" : "OK"}
          </span>
          {footer}
        </p>
      ) : null}
    </div>
  );
}

function ReportSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2.5 text-sm font-black text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={15} />
        </span>
        {title}
      </h2>
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">{children}</div>
    </section>
  );
}

function AgileGroup({
  icon: Icon,
  title,
  tone,
  items,
  empty,
}: {
  icon: React.ElementType;
  title: string;
  tone: "green" | "blue" | "red";
  items: string[];
  empty: string;
}) {
  const cfg = {
    green: { icon: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-400", title: "text-emerald-800" },
    blue:  { icon: "bg-blue-100 text-blue-600",   dot: "bg-blue-400",   title: "text-blue-800" },
    red:   { icon: "bg-red-100 text-red-600",     dot: "bg-red-400",    title: "text-red-800" },
  }[tone];
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${cfg.icon}`}>
          <Icon size={13} />
        </span>
        <p className={`text-[11px] font-black uppercase tracking-wide ${cfg.title}`}>{title}</p>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs font-medium text-slate-600">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">{empty}</p>
      )}
    </div>
  );
}

function GanttBar({
  label,
  start,
  end,
  project,
  progress,
  color,
  labelWidth = 160,
  level = 1,
  status,
}: {
  label: string;
  start: Date | string;
  end: Date | string;
  project: any;
  progress: number;
  color: string;
  labelWidth?: number;
  level?: number;
  status?: string;
}) {
  const projectStart = project.plannedStart;
  const projectEnd = project.currentEnd ?? project.plannedEnd;
  const left = timelinePosition(start, projectStart, projectEnd);
  const right = timelinePosition(end, projectStart, projectEnd);
  const width = Math.max(2, right - left);
  const filled = clamp(progress, 0, 100);
  const showInline = filled > 18 && width > 15;
  const isSummary = level <= 2;
  const statusColor = status === "DONE" ? "bg-emerald-500" : status === "BLOCKED" ? "bg-red-500" : status === "IN_PROGRESS" ? "bg-blue-500" : status === "IN_REVIEW" ? "bg-violet-500" : "bg-slate-400";
  return (
    <div className={`flex items-center rounded-lg ${isSummary ? "bg-slate-50/80" : ""}`} style={{ minHeight: isSummary ? "36px" : "32px" }}>
      <span className={`shrink-0 truncate pr-3 text-[11px] ${isSummary ? "font-black text-slate-800" : "font-medium text-slate-600"}`} style={{ width: labelWidth, paddingLeft: Math.max(0, level - 1) * 10 }} title={label}>
        <span className={`mr-2 inline-block h-2 w-2 rounded-full ${statusColor}`} />
        {label}
      </span>
      <div className="relative flex-1">
        {/* Track */}
        <div className="h-6 w-full rounded-md bg-slate-100" />
        {/* Bar segment */}
        <div
          className="absolute top-0 h-6 overflow-hidden rounded-md bg-slate-200"
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          <div
            className={`h-full rounded-md ${status === "DONE" ? "bg-emerald-500" : status === "BLOCKED" ? "bg-red-500" : color} flex items-center justify-end`}
            style={{ width: `${filled}%` }}
          >
            {showInline ? (
              <span className="pr-2 text-[10px] font-black text-white drop-shadow">{Math.round(progress)}%</span>
            ) : null}
          </div>
        </div>
        {/* Label outside when bar is too small */}
        {!showInline ? (
          <span
            className="absolute top-0 flex h-6 items-center pl-1 text-[10px] font-bold text-slate-500"
            style={{ left: `${Math.min(left + width, 98)}%` }}
          >
            {Math.round(progress)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MilestoneRollupCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "slate" | "green" | "amber" | "red" }) {
  const styles = {
    slate: "border-slate-100 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-bold opacity-70">{detail}</p>
    </div>
  );
}

function MilestoneReportRow({ item }: { item: any }) {
  const isTask = "plannedEnd" in item;
  const status = isTask ? taskReportStatus(item) : milestoneReportStatus(item);
  const progress = isTask ? Number(item.progressPercent ?? 0) : item.status === "COMPLETED" ? 100 : 0;
  const owner = isTask ? item.owner?.name ?? "-" : item.owner ?? "-";
  const text = `${item.name} ${owner} ${status.label}`;
  const rowBg =
    status.tone === "red" ? "bg-red-50/50 hover:bg-red-50" :
    status.tone === "amber" ? "bg-amber-50/30 hover:bg-amber-50/60" :
    "hover:bg-slate-50";
  return (
    <tr data-status-report-row data-report-text={text} data-report-status={status.label} data-report-owner={owner} data-report-level={status.label} className={rowBg}>
      <td className="px-6 py-3 font-semibold text-slate-800">
        {isTask && item.wbsCode ? <span className="mr-1.5 text-slate-400">{item.wbsCode}</span> : null}
        {item.name}
      </td>
      <td className="py-3 text-slate-500">{formatDate(isTask ? item.plannedEnd : item.plannedDate)}</td>
      <td className="py-3 text-slate-500">{owner}</td>
      <td className="py-3 text-slate-500">{isTask ? formatHours(item.estimatedHours) : "-"}</td>
      <td className="py-3"><StatusPill tone={status.tone}>{status.label}</StatusPill></td>
      <td className="py-3 pr-6"><InlineProgress value={progress} /></td>
    </tr>
  );
}

function milestoneStatusRollup(items: any[], now: Date) {
  const total = items.length;
  let done = 0;
  let late = 0;
  let progressSum = 0;

  for (const item of items) {
    const isTask = "plannedEnd" in item;
    const status = isTask ? taskReportStatus(item) : milestoneReportStatusAtDate(item, now);
    const progress = isTask ? Number(item.progressPercent ?? 0) : item.status === "COMPLETED" ? 100 : 0;
    if (status.tone === "green") done += 1;
    if (status.tone === "red") late += 1;
    progressSum += clamp(progress, 0, 100);
  }

  return {
    total,
    done,
    late,
    attention: Math.max(0, total - done - late),
    donePct: total ? Math.round((done / total) * 100) : 0,
    progress: total ? Math.round(progressSum / total) : 0,
  };
}

function ActivityReportRow({ task, now }: { task: any; now: Date }) {
  const status = taskReportStatus(task);
  const days = Math.ceil((new Date(task.plannedEnd).getTime() - startOfDay(now).getTime()) / 86_400_000);
  const owner = task.owner?.name ?? "-";
  const text = `${task.legacyItemCode ?? ""} ${task.name} ${owner} ${status.label}`;
  const rowBg =
    status.tone === "red" ? "bg-red-50/60 hover:bg-red-50" :
    status.tone === "amber" ? "bg-amber-50/40 hover:bg-amber-50" :
    status.tone === "green" ? "hover:bg-emerald-50/40" :
    "hover:bg-slate-50";
  return (
    <tr data-status-report-row data-report-text={text} data-report-status={status.label} data-report-owner={owner} data-report-level={status.label} className={rowBg}>
      <td className="px-6 py-2.5"><StatusPill tone={status.tone}>{status.label}</StatusPill></td>
      <td className="py-2.5 font-semibold text-slate-800">{task.legacyItemCode ? `${task.legacyItemCode} – ` : ""}{truncate(task.name, 62)}</td>
      <td className="py-2.5 text-slate-500">{owner}</td>
      <td className={`py-2.5 pr-6 font-semibold ${days < 0 ? "text-red-600" : days <= 3 ? "text-amber-600" : "text-slate-500"}`}>
        {days < 0 ? `${Math.abs(days)}d em atraso` : `${days}d`}
      </td>
    </tr>
  );
}

function ResourceReportRow({ row }: { row: { name: string; planned: number; actual: number; role?: string } }) {
  const consumption = row.planned > 0 ? (row.actual / row.planned) * 100 : 0;
  const over = consumption > 100;
  const pct = Math.min(Math.round(consumption), 100);
  const status = over ? "Estourado" : "Dentro da Meta";
  return (
    <div
      data-status-report-row
      data-report-text={`${row.name} ${row.role ?? ""} ${status}`}
      data-report-status={status}
      data-report-owner={row.name}
      data-report-level={status}
      className={`px-6 py-4 ${over ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-slate-50"}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-black text-slate-800">{row.name}</p>
          <p className="text-[11px] text-slate-400">{row.role ?? "Recurso do projeto"}</p>
        </div>
        <StatusPill tone={over ? "red" : "green"}>{status}</StatusPill>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${over ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`shrink-0 text-xs font-black ${over ? "text-red-600" : "text-slate-700"}`}>
          {Math.round(consumption)}%
        </span>
      </div>
      <div className="mt-1.5 flex gap-4 text-[11px] text-slate-400">
        <span>Planejado: <strong className="text-slate-600">{row.planned.toFixed(0)}h</strong></span>
        <span>Realizado: <strong className={over ? "text-red-600" : "text-slate-600"}>{row.actual.toFixed(0)}h</strong></span>
      </div>
    </div>
  );
}

function RiskReportRow({ row, index }: { row: { type: string; item: any }; index: number }) {
  const item = row.item;
  const isBlocker = row.type === "blocker";
  const level = isBlocker ? "Crítico" : riskClassPt(item.classification);
  const owner = isBlocker ? item.responsiblePerson ?? "-" : item.owner ?? "-";
  const text = `${isBlocker ? item.title : item.name} ${owner} ${level} ${isBlocker ? item.nextAction ?? "" : item.preventiveActions ?? item.contingencyPlan ?? ""}`;
  return (
    <tr
      data-status-report-row
      data-report-text={text}
      data-report-status={isBlocker ? "Bloqueado" : riskStatusPt(item.status)}
      data-report-owner={owner}
      data-report-level={level}
      className={isBlocker ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50"}
    >
      <td className="px-6 py-3 font-semibold text-slate-800">
        <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-black ${isBlocker ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
          {isBlocker ? "BLOQUEIO" : "RISCO"}
        </span>
        {isBlocker ? item.title : item.name}
        <p className="mt-0.5 text-[11px] text-red-500">{isBlocker ? `${daysOpen(item.openedAt, item.resolvedAt)} dias em aberto` : riskStatusPt(item.status)}</p>
      </td>
      <td className="py-3 text-xs text-slate-500">{isBlocker ? item.impactDescription ?? `${item.scheduleImpactDays} dias` : item.impact ?? item.description ?? "Impacto a monitorar"}</td>
      <td className="py-3">
        <StatusPill tone={isBlocker || item.classification === "CRITICAL" ? "red" : item.classification === "HIGH" ? "amber" : "slate"}>
          {level}
        </StatusPill>
      </td>
      <td className="py-3 text-xs text-slate-500">{isBlocker ? item.nextAction ?? "Definir plano de ação" : item.preventiveActions ?? item.contingencyPlan ?? "Monitorar e revisar"}</td>
      <td className="py-3 pr-6 font-semibold text-slate-700">{owner}</td>
    </tr>
  );
}

// ─── Risk card ──────────────────────────────────────────────────────────────

function RiskCard({ risk, index }: { risk: any; index: number }) {
  const probability = risk.probability === "HIGH" ? 4 : risk.probability === "MEDIUM" ? 3 : 2;
  const impact = risk.classification === "CRITICAL" ? 4 : risk.classification === "HIGH" ? 4 : risk.classification === "MEDIUM" ? 3 : 2;
  const exposure = probability * impact;
  const borderColor =
    risk.classification === "CRITICAL"
      ? "border-l-red-500"
      : risk.classification === "HIGH"
        ? "border-l-orange-400"
        : "border-l-blue-400";

  return (
    <div className={`flex flex-col rounded-xl border border-l-4 border-slate-100 bg-white p-5 shadow-sm ${borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-[#063eb3]">R-{String(index + 1).padStart(3, "0")}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
            risk.classification === "CRITICAL"
              ? "bg-red-100 text-red-700"
              : risk.classification === "HIGH"
                ? "bg-orange-100 text-orange-700"
                : risk.classification === "MEDIUM"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
          }`}
        >
          {riskClassPt(risk.classification)}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-black leading-5 text-slate-950">{risk.name}</h3>
      <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{risk.description ?? risk.event ?? "Risco do projeto"}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <RiskScore label="Probabilidade" value={probability} />
        <RiskScore label="Impacto" value={impact} />
        <RiskScore label="Exposição" value={exposure} high={exposure >= 12} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <p><strong className="text-slate-700">Categoria:</strong> {risk.category ?? "Projeto"}</p>
        <p><strong className="text-slate-700">Responsável:</strong> {risk.owner ?? "-"}</p>
        <p><strong className="text-slate-700">Status:</strong> {riskStatusPt(risk.status)}</p>
        <p><strong className="text-slate-700">Escalar?</strong> {["CRITICAL", "HIGH"].includes(risk.classification) ? "Sim" : "Não"}</p>
      </div>
      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-black text-blue-600 hover:text-blue-800">Ver detalhes do risco</summary>
        <div className="mt-3 grid gap-2">
          <SmallInfo label="Data de registro" value={formatDate(risk.registeredAt)} />
          <SmallInfo label="Causa" value={risk.cause} />
          <SmallInfo label="Evento" value={risk.event} />
          <SmallInfo label="Estratégia de resposta" value={strategyPt(risk.responseStrategy)} />
          <SmallInfo label="Ações preventivas" value={risk.preventiveActions} />
          <SmallInfo label="Plano de contingência" value={risk.contingencyPlan} />
          <SmallInfo label="Gatilhos" value={risk.triggers} />
          <SmallInfo label="Última revisão" value={formatDate(risk.lastReviewAt)} />
        </div>
      </details>
    </div>
  );
}

function RiskScore({ label, value, high }: { label: string; value: number; high?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${high ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-black ${high ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────

function FilterStrip({ search, selects, button }: { search: string; selects: string[]; button?: string }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder={search}
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
        {selects.map((select) => (
          <select key={select} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:bg-white">
            <option>{select}</option>
          </select>
        ))}
        {button ? (
          <button type="button" className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700">
            {button}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function HeroDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">{label}</p>
      <p className="mt-0.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "red" | "amber" | "green" | "blue" | "slate"; children: React.ReactNode }) {
  const cfg = {
    red:   { card: "border-red-200 bg-red-50 text-red-700",         dot: "bg-red-500" },
    amber: { card: "border-amber-200 bg-amber-50 text-amber-700",   dot: "bg-amber-400" },
    green: { card: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    blue:  { card: "border-blue-200 bg-blue-50 text-blue-700",      dot: "bg-blue-500" },
    slate: { card: "border-slate-200 bg-slate-50 text-slate-600",   dot: "bg-slate-400" },
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${cfg.card}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {children}
    </span>
  );
}

function InlineProgress({ value, tone = "blue" }: { value: number; tone?: "blue" | "red" }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone === "red" ? "bg-red-500" : "bg-cyan-500"}`}
          style={{ width: `${clamp(value, 0, 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-500">{Math.round(value)}%</span>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: unknown }) {
  return (
    <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
      <span className="font-black text-slate-500">{label}: </span>
      {String(value ?? "-")}
    </p>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sortTasksForEdt(tasks: any[]) {
  return [...tasks].sort((a, b) => compareWbs(a.wbsCode, b.wbsCode) || new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());
}

function compareWbs(a?: string | null, b?: string | null) {
  const ap = String(a ?? "999999").split(".").map((p) => Number(p) || 0);
  const bp = String(b ?? "999999").split(".").map((p) => Number(p) || 0);
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const diff = (ap[i] ?? 0) - (bp[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function buildTaskTree(tasks: any[]) {
  const nodes = new Map(tasks.map((t) => [t.id, { task: t, children: [] as any[] }]));
  const roots: any[] = [];
  for (const t of tasks) {
    const node = nodes.get(t.id)!;
    const parent = t.parentTaskId ? nodes.get(t.parentTaskId) : parentNodeByWbs(nodes, t.wbsCode);
    if (parent && parent.task.id !== t.id) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (items: any[]) => {
    items.sort((a, b) => compareWbs(a.task.wbsCode, b.task.wbsCode));
    items.forEach((i) => sort(i.children));
  };
  sort(roots);
  return roots;
}

function parentNodeByWbs(nodes: Map<string, any>, wbs?: string | null) {
  if (!wbs?.includes(".")) return null;
  const parentWbs = wbs.split(".").slice(0, -1).join(".");
  return [...nodes.values()].find((n) => n.task.wbsCode === parentWbs) ?? null;
}

function statusReportLeafTasks(tasks: any[]) {
  const parents = new Set(tasks.map((t) => t.parentTaskId).filter(Boolean));
  const leaves = tasks.filter((t) => !parents.has(t.id));
  return leaves.length ? leaves : tasks;
}

function statusReportActivities(tasks: any[], now: Date) {
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  return [...tasks]
    .filter((t) => t.status !== "DONE" && (new Date(t.plannedEnd) <= weekAhead || t.status === "BLOCKED"))
    .sort((a, b) => Number(a.status !== "BLOCKED") - Number(b.status !== "BLOCKED") || new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime());
}

function resourceConsumptionRows(project: any, tasks: any[]) {
  const rows = new Map<string, { name: string; planned: number; actual: number; role?: string }>();
  for (const alloc of project.allocations ?? []) {
    const name = alloc.user?.name ?? "Sem responsável";
    const row = rows.get(name) ?? { name, planned: 0, actual: 0, role: alloc.user?.jobTitle };
    row.planned += Number(alloc.allocatedHours ?? 0);
    rows.set(name, row);
  }
  for (const task of tasks) {
    const name = task.owner?.name ?? "Sem responsável";
    const row = rows.get(name) ?? { name, planned: 0, actual: 0, role: task.owner?.jobTitle };
    if (!(project.allocations ?? []).length) row.planned += Number(task.estimatedHours ?? 0);
    row.actual += Number(task.actualHours ?? 0);
    rows.set(name, row);
  }
  return [...rows.values()].sort((a, b) => b.actual - a.actual);
}

function activeBaseline(project: any) {
  return (project.baselines ?? []).find((b: any) => b.isActive) ?? (project.baselines ?? [])[0];
}

function statusReportReferenceDate(project: any, tasks: any[], generatedAt: Date) {
  const start = startOfDay(new Date(project.plannedStart));
  const end = startOfDay(new Date(project.currentEnd ?? project.plannedEnd));
  const projectProgress = Number(project.progressPercent ?? 0);
  const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;
  const latestActualEnd = latestDate(tasks.map((task) => task.actualEnd).filter(Boolean));
  const latestProgressDate = latestDate(
    tasks
      .filter((task) => Number(task.progressPercent ?? 0) > 0)
      .map((task) => task.actualEnd ?? task.plannedEnd ?? task.plannedStart)
      .filter(Boolean),
  );

  const preferred = projectProgress > 0
    ? updatedAt ?? latestDate([latestActualEnd, latestProgressDate, generatedAt].filter(Boolean))
    : generatedAt;

  return clampDate(preferred ?? generatedAt, start, end);
}

function latestDate(values: Array<Date | string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps));
}

function clampDate(value: Date, start: Date, end: Date) {
  const timestamp = value.getTime();
  if (timestamp < start.getTime()) return start;
  if (timestamp > end.getTime()) return end;
  return value;
}

function plannedProgressForDate(project: any, date: Date, baseline?: any, tasks: any[] = []) {
  if (baseline?.tasks?.length) return weightedPlannedProgress(baseline.tasks, date);
  if (tasks.length) return weightedPlannedProgress(tasks, date);
  const start = new Date(project.plannedStart).getTime();
  const end = new Date(project.currentEnd ?? project.plannedEnd).getTime();
  if (end <= start) return 100;
  return clamp(((date.getTime() - start) / (end - start)) * 100, 0, 100);
}

function statusCurveData(project: any, tasks: any[], baseline: any | undefined, now: Date) {
  const projectProgress = clamp(Number(project.progressPercent ?? 0), 0, 100);
  const taskCurrentProgress = currentRealProgress(tasks, now);
  const currentProgress = Math.max(taskCurrentProgress, projectProgress);
  const scale = taskCurrentProgress > 0 && currentProgress > taskCurrentProgress ? currentProgress / taskCurrentProgress : 1;
  const points = statusCurvePoints(project, tasks, now);
  const today = startOfDay(now).getTime();
  return points.map((point) => {
    const pointDay = startOfDay(point).getTime();
    const isFuture = pointDay > today;
    const realPoint = pointDay === today ? now : point;
    const rawRealized = taskCurrentProgress > 0
      ? weightedRealProgress(tasks, realPoint, now) * scale
      : fallbackRealProgressAtDate(project, realPoint, now, currentProgress);
    return {
      name: formatDate(point).slice(0, 5),
      planejado: plannedProgressForDate(project, point, baseline, tasks),
      realizado: isFuture ? null : clamp(rawRealized, 0, currentProgress),
    };
  });
}

function currentRealProgress(tasks: any[], now: Date) {
  const calculated = weightedRealProgress(tasks, now, now);
  return clamp(calculated, 0, 100);
}

function fallbackRealProgressAtDate(project: any, date: Date, now: Date, currentProgress: number) {
  if (currentProgress <= 0) return 0;
  const start = new Date(project.plannedStart).getTime();
  const point = date.getTime();
  const current = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(point) || !Number.isFinite(current)) return currentProgress;
  if (point >= current) return currentProgress;
  if (current <= start) return currentProgress;
  if (point <= start) return 0;
  return clamp(((point - start) / (current - start)) * currentProgress, 0, currentProgress);
}

function statusCurvePoints(project: any, tasks: any[], now: Date) {
  const start = startOfDay(new Date(project.plannedStart));
  const end = startOfDay(new Date(project.currentEnd ?? project.plannedEnd));
  const timestamps = new Set<number>([start.getTime(), end.getTime(), startOfDay(now).getTime()]);
  const span = Math.max(1, end.getTime() - start.getTime());
  const pointCount = Math.min(14, Math.max(7, Math.ceil(span / (14 * 86_400_000)) + 1));

  for (let index = 0; index < pointCount; index += 1) {
    timestamps.add(startOfDay(new Date(start.getTime() + (span * index) / (pointCount - 1))).getTime());
  }

  return [...timestamps]
    .filter((timestamp) => timestamp >= start.getTime() && timestamp <= end.getTime())
    .sort((a, b) => a - b)
    .map((timestamp) => new Date(timestamp));
}

function weightedPlannedProgress(tasks: any[], date: Date) {
  const total = tasks.reduce((s: number, t: any) => s + taskWeight(t), 0);
  if (!total) return 0;
  const done = tasks.reduce((s: number, t: any) => s + taskWeight(t) * (plannedTaskProgressAtDate(t, date) / 100), 0);
  return clamp((done / total) * 100, 0, 100);
}

function weightedRealProgress(tasks: any[], date: Date, now: Date) {
  const total = tasks.reduce((s: number, t: any) => s + taskWeight(t), 0);
  if (!total) return 0;
  const done = tasks.reduce((s: number, t: any) => s + taskWeight(t) * (realTaskProgressAtDate(t, date, now) / 100), 0);
  return clamp((done / total) * 100, 0, 100);
}

function plannedTaskProgressAtDate(task: any, date: Date) {
  const start = new Date(task.plannedStart ?? task.plannedEnd).getTime();
  const end = new Date(task.plannedEnd ?? task.plannedStart).getTime();
  const point = date.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (point <= start) return 0;
  if (point >= end || end <= start) return 100;
  return clamp(((point - start) / (end - start)) * 100, 0, 100);
}

function realTaskProgressAtDate(task: any, date: Date, now: Date) {
  const currentProgress = actualTaskProgressPercent(task);
  const completionDate = task.actualEnd ? new Date(task.actualEnd) : task.status === "DONE" ? new Date(task.plannedEnd) : null;
  const point = date.getTime();
  const current = now.getTime();

  if (completionDate && point >= completionDate.getTime()) return 100;
  if (point >= current) return currentProgress;

  const start = new Date(task.actualStart ?? task.plannedStart ?? task.plannedEnd);
  if (!Number.isFinite(start.getTime()) || point <= start.getTime()) return 0;

  const end = completionDate?.getTime() ?? current;
  if (end <= start.getTime()) return currentProgress;

  const ratio = clamp((point - start.getTime()) / (end - start.getTime()), 0, 1);
  const targetProgress = completionDate ? 100 : currentProgress;
  return clamp(targetProgress * ratio, 0, targetProgress);
}

function actualTaskProgressPercent(task: any) {
  const progress = Number(task.progressPercent ?? 0);
  const estimated = Number(task.estimatedHours ?? 0);
  const actualHours = Number(task.actualHours ?? 0);
  const hoursProgress = estimated > 0 ? (actualHours / estimated) * 100 : 0;
  if (task.status === "DONE") return 100;
  return clamp(Math.max(progress, hoursProgress), 0, 100);
}

function taskWeight(task: any) {
  return Math.max(1, Number(task.estimatedHours ?? task.plannedDuration ?? 1));
}

function scopeSummary(project: any, tasks: any[]) {
  const outOfScope = tasks.filter(isOutOfScopeTask);
  const changes = [...(project.delays ?? []), ...(project.replannings ?? [])].filter(isScopeChange);
  const count = outOfScope.length + changes.length;
  const hoursImpact = outOfScope.reduce((s: number, t: any) => s + Number(t.estimatedHours ?? 0), 0) + changes.reduce((s: number, i: any) => s + Number(i.hoursImpact ?? 0), 0);
  const daysImpact = changes.reduce((s: number, i: any) => s + Number(i.scheduleImpactDays ?? 0), 0);
  const impact = count ? `Impacto: +${formatHours(hoursImpact)}${daysImpact ? ` / +${daysImpact} dias` : ""}` : "Impacto: sem mudanças registradas";
  return { count, label: count ? "Em acompanhamento" : "Mantido", impact };
}

function isOutOfScopeTask(task: any) {
  const text = `${task.occurType ?? ""} ${task.occurSituation ?? ""} ${task.name ?? ""} ${task.description ?? ""}`.toLowerCase();
  return ["fora do contrato", "fora de contrato", "fora do escopo", "mudanca de escopo", "mudança de escopo", "adicional", "extra"].some((t) => text.includes(t));
}

function isScopeChange(item: any) {
  const text = `${item.reason ?? ""} ${item.technicalJustify ?? ""} ${item.task?.name ?? ""}`.toLowerCase();
  return ["escopo", "contrato", "adicional", "extra", "mudanca", "mudança"].some((t) => text.includes(t));
}

function statusExecutiveSummary(project: any, tasks: any[], delayedTasks: any[], openBlockers: any[], progress: number, plannedProgress: number) {
  if (project.notes || project.home?.mission || project.description) return project.notes ?? project.home?.mission ?? project.description;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const scheduleText = progress >= plannedProgress ? "aderente ao planejado" : `abaixo do planejado (${Math.round(plannedProgress)}%)`;
  return `O projeto está com ${Math.round(progress)}% de progresso realizado, ${scheduleText}. Das ${tasks.length} atividades operacionais, ${done} estão concluídas e ${delayedTasks.length} estão atrasadas. Foram registradas ${formatHours(project.actualHours)} realizadas de ${formatHours(project.plannedHours)} planejadas, com ${openBlockers.length} bloqueio(s) ativo(s) no momento.`;
}

function taskReportStatus(task: any) {
  if (task.status === "BLOCKED") return { label: "Bloqueado", tone: "red" as const };
  if (task.status === "DONE") return { label: "Concluído", tone: "green" as const };
  if (new Date(task.plannedEnd) < new Date()) return { label: "Atrasado", tone: "red" as const };
  if (task.status === "TODO") return { label: "Planejado", tone: "amber" as const };
  return { label: "No Prazo", tone: "blue" as const };
}

function milestoneReportStatus(milestone: any) {
  return milestoneReportStatusAtDate(milestone, new Date());
}

function milestoneReportStatusAtDate(milestone: any, date: Date) {
  if (milestone.status === "COMPLETED") return { label: "Concluído", tone: "green" as const };
  if (new Date(milestone.plannedDate) < date) return { label: "Atrasado", tone: "red" as const };
  return { label: "No Prazo", tone: "blue" as const };
}

function getProjectHealth(project: any) {
  const delayed = project.tasks.filter((t: any) => t.status !== "DONE" && t.plannedEnd < new Date()).length;
  const criticalRisks = project.risks.filter((r: any) => r.classification === "CRITICAL").length;
  const openBlockers = project.blockers.filter((b: any) => b.status !== "RESOLVED" && b.status !== "CANCELED").length;
  if (criticalRisks || openBlockers > 1 || delayed > 3) return { label: "Crítica", tone: "text-red-200" };
  if (openBlockers || delayed || project.risks.some((r: any) => r.classification === "HIGH")) return { label: "Atenção", tone: "text-amber-200" };
  return { label: "Saudável", tone: "text-emerald-200" };
}

function timelinePosition(value: Date | string, start: Date | string, end: Date | string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const v = new Date(value).getTime();
  if (e <= s) return 0;
  return clamp(((v - s) / (e - s)) * 100, 0, 100);
}

function businessDays(start: Date | string, end: Date | string) {
  const cur = startOfDay(new Date(start));
  const last = startOfDay(new Date(end));
  let total = 0;
  while (cur <= last) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) total += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

function daysBetween(start: Date | string, end: Date | string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthYear(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function formatDateTime(value: Date) {
  return value.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPercent(value: number) {
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysOpen(openedAt: Date | string, resolvedAt?: Date | string | null) {
  const start = new Date(openedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  return Math.max(0, Math.ceil((end - start) / 86_400_000));
}

function countBy(items: any[], key: string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const v = String(item[key] ?? "Não informado");
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
}

function statusPt(status: string) {
  return ({ TODO: "A fazer", IN_PROGRESS: "Em andamento", IN_REVIEW: "Em validação", BLOCKED: "Bloqueado", DONE: "Concluído", PLANNED: "Planejado", COMPLETED: "Concluído", DELAYED: "Atrasado" } as Record<string, string>)[status] ?? status;
}

function blockerStatusPt(status: string) {
  return ({ OPEN: "Aberto", IN_PROGRESS: "Em tratamento", RESOLVED: "Resolvido", CANCELED: "Cancelado" } as Record<string, string>)[status] ?? status;
}

function riskStatusPt(status: string) {
  return ({ OPEN: "Aberto", IN_TREATMENT: "Em tratamento", MATERIALIZED: "Materializado", CLOSED: "Encerrado" } as Record<string, string>)[status] ?? status;
}

function priorityPt(priority: string) {
  return ({ LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" } as Record<string, string>)[priority] ?? priority;
}

function riskClassPt(classification: string) {
  return ({ LOW: "Baixo", MEDIUM: "Médio", HIGH: "Alto", CRITICAL: "Crítico" } as Record<string, string>)[classification] ?? classification;
}

function levelPt(level: string) {
  return ({ LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" } as Record<string, string>)[level] ?? level;
}

function stakeholderTypePt(type: string) {
  return ({ INTERNAL: "Interno", CLIENT: "Cliente", PARTNER: "Parceiro", SUPPLIER: "Fornecedor", SPONSOR: "Patrocinador" } as Record<string, string>)[type] ?? type;
}

function strategyPt(strategy: string) {
  return ({ MITIGATE: "Mitigar", ACCEPT: "Aceitar", TRANSFER: "Transferir", AVOID: "Evitar" } as Record<string, string>)[strategy] ?? strategy;
}
