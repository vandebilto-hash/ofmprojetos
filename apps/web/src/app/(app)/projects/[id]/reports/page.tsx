import { AlertTriangle, CalendarDays, CheckCircle2, CloudDownload, FileBarChart, ListChecks, ShieldAlert, Target, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";

type ReportTask = {
  id: string;
  parentTaskId: string | null;
  wbsCode: string | null;
  name: string;
  status: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualEnd: Date | null;
  estimatedHours: unknown;
  actualHours: unknown;
  progressPercent: unknown;
  owner: { id: string; name: string; jobTitle: string | null } | null;
};

export default async function ProjectReportsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      manager: true,
      tasks: {
        include: { owner: true },
        orderBy: { plannedStart: "asc" }
      },
      blockers: { include: { task: true } },
      baselines: { include: { tasks: true }, orderBy: { createdAt: "desc" } },
      allocations: { include: { user: true, task: true } },
      reports: true
    }
  });
  if (!project) notFound();

  const tasks = [...project.tasks].sort((left, right) => compareWbsCodes(left.wbsCode, right.wbsCode)) as ReportTask[];
  const leafTasks = finalTasks(tasks);
  const completedTasks = leafTasks.filter((task) => task.status === "DONE");
  const delayedTasks = leafTasks.filter((task) => task.status !== "DONE" && task.plannedEnd < new Date());
  const dueSoonTasks = leafTasks.filter((task) => isDueWithinOneDay(task));
  const scheduleHealth = getScheduleHealth(delayedTasks.length, dueSoonTasks.length);
  const activeBlockers = project.blockers.filter((blocker) => blocker.status !== "RESOLVED" && blocker.status !== "CANCELED");
  const progress = Number(project.progressPercent);
  const plannedProgress = plannedProgressForToday(project.plannedStart, project.plannedEnd);
  const businessDays = countBusinessDays(project.plannedStart, project.currentEnd);
  const resourceRows = resourceEffortRows(leafTasks);
  const criticalRisks = delayedTasks.length + activeBlockers.length;
  const topLevelTasks = tasks.filter((task) => (task.wbsCode?.split(".").length ?? 1) <= 2).slice(0, 6);
  const curveSData = buildCurveSData(leafTasks, project.plannedStart, project.currentEnd);

  const reports = [
    ["project-general", "Relatorio geral do projeto", "Resumo executivo, datas, horas, custos, tarefas e bloqueios"],
    ["project-status", "Relatorio de status do projeto", "Status, progresso, tarefas atrasadas e proximos marcos"],
    ["tasks-by-status", "Tarefas por status", "Agrupamento operacional por coluna/status"],
    ["delayed-tasks", "Tarefas atrasadas", "Tarefas vencidas, responsaveis e impacto"],
    ["blockers", "Bloqueios", "Bloqueios abertos/resolvidos e impactos"],
    ["baseline-comparison", "Baseline x atual", "Variacao de prazo, horas e custo contra snapshots"],
    ["planned-vs-actual-hours", "Horas planejadas x realizadas", "Comparacao por tarefa e consolidado"],
    ["resource-allocation", "Alocacao de recursos", "Capacidade, horas alocadas e sobrealocacao"],
    ["overallocation", "Sobrealocacao", "Recursos acima da capacidade semanal"],
    ["financial", "Financeiro do projeto", "Custo estimado e realizado por horas"],
    ["client-executive", "Executivo para cliente", "Linguagem resumida e visao externa"]
  ];

  return (
    <>
      <PageHeader title={`Relatorios | ${project.name}`} description="Status report executivo, PDF, Excel, CSV legado e XML compativel." />
      <ProjectTabs projectId={project.id} />

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between rounded-md bg-[#172449] px-6 py-5 text-white shadow-soft">
          <div className="flex items-end gap-5">
            <div>
              <div className="text-3xl font-black leading-none">OFM</div>
              <div className="text-[10px] uppercase tracking-wide text-white/75">Systems</div>
            </div>
            <h2 className="pb-1 text-2xl font-semibold">Status Report</h2>
          </div>
          <p className="text-sm italic text-white/90">Relatorio gerado em {new Date().toLocaleString("pt-BR")}</p>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
          <div className="rounded-lg border border-slate-300 p-5 shadow-sm">
            <h1 className="text-2xl font-black text-ink">{project.name}</h1>
            <p className="mt-2 text-sm">Cliente: <strong>{project.client.name}</strong></p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <span className="inline-flex items-center gap-2"><ListChecks size={14} className="text-brand-600" />Gerente: <strong>{project.manager.name}</strong></span>
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-brand-600" />Periodo: <strong>{formatDate(project.plannedStart)} - {formatDate(project.currentEnd)} - {businessDays} dias uteis</strong></span>
              <span className="inline-flex items-center gap-2"><Target size={14} className="text-brand-600" />Fase: <strong>{currentPhase(tasks)}</strong></span>
            </div>
          </div>

          <div className="grid gap-3">
            <a
              href={`/api/export?projectId=${project.id}&format=pdf&reportType=project-status`}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
            >
              <CloudDownload size={15} /> PDF
            </a>
            <div className="rounded-lg border border-slate-300 p-4 shadow-sm">
              <p className="text-xs font-black uppercase">Progresso geral</p>
              <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                <strong className="text-2xl">{progress}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <MetricTile title="Progresso realizado" value={`${progress}%`} detail={`${completedTasks.length} de ${leafTasks.length} tarefas`} footer={`Planejado para hoje: ${plannedProgress}%`} />
          <MetricTile
            title="Saude do cronograma"
            value={scheduleHealth.label}
            detail={`${delayedTasks.length} atrasada(s) | ${dueSoonTasks.length} vencendo em 1 dia`}
            footer={scheduleHealth.description}
            tone={scheduleHealth.tone}
          />
          <MetricTile title="Riscos criticos" value={String(criticalRisks)} detail="Atrasadas + impeditivos ativos" tone={criticalRisks ? "red" : "green"} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5">
          <ReportPanel title="Resumo Executivo" icon={<FileBarChart size={17} className="text-cyan-600" />}>
            <p className="max-h-64 overflow-y-auto pr-2 leading-7 text-slate-700">
              O projeto apresenta {progress >= plannedProgress ? "evolucao aderente" : "atraso"} em relacao ao cronograma inicialmente previsto.
              Foram executadas {formatHours(project.actualHours)} de {formatHours(project.plannedHours)} planejadas,
              restando {formatHours(project.remainingHours)}. Os principais pontos de atencao sao {delayedTasks.length} tarefa(s)
              atrasada(s) e {activeBlockers.length} bloqueio(s) ativo(s), com foco de acompanhamento nas proximas entregas do cronograma.
            </p>
          </ReportPanel>

          <ReportPanel title="Panorama Agil" icon={<Trophy size={17} className="text-cyan-600" />}>
            <div className="max-h-64 overflow-y-auto pr-3 text-sm">
              <h4 className="mb-2 flex items-center gap-2 font-black uppercase text-emerald-700"><CheckCircle2 size={15} /> Entregas realizadas ultimos 15 dias:</h4>
              <ol className="list-decimal space-y-3 pl-5">
                {completedTasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="break-words">
                    <strong className="block max-w-full break-words">{task.name}</strong>
                    <p className="mt-1 text-slate-600">Finalizada em {formatDate(task.actualEnd ?? task.plannedEnd)} com {Number(task.progressPercent)}% de conclusao.</p>
                  </li>
                ))}
              </ol>
              <div className="my-4 border-t border-line" />
              <h4 className="mb-2 font-black uppercase">Foco da proxima quinzena:</h4>
              <ol className="list-decimal space-y-2 pl-5">
                {leafTasks.filter((task) => task.status !== "DONE").slice(0, 4).map((task) => (
                  <li key={task.id} className="break-words"><strong>{task.name}</strong> - prazo {formatDate(task.plannedEnd)}</li>
                ))}
              </ol>
              <div className="my-4 border-t border-line" />
              <h4 className={`mb-2 flex items-center gap-2 font-black uppercase ${scheduleHealth.textClass}`}>
                <ShieldAlert size={15} /> Saude do cronograma: {scheduleHealth.label}
              </h4>
              <div className={`${scheduleHealth.softClass} rounded-md border px-3 py-2 text-sm font-semibold`}>
                {scheduleHealth.description}. {delayedTasks.length} atividade(s) atrasada(s), {dueSoonTasks.length} vencendo em ate 1 dia.
              </div>
              {activeBlockers.length ? (
                <>
                  <div className="my-4 border-t border-line" />
                  <h4 className="mb-2 flex items-center gap-2 font-black uppercase text-red-700"><AlertTriangle size={15} /> Bloqueio critico:</h4>
                  <ul className="list-disc space-y-2 pl-5">
                    {activeBlockers.slice(0, 4).map((blocker) => (
                      <li key={blocker.id} className="break-words"><strong>{blocker.task?.name ?? blocker.title}</strong><br /><span className="text-slate-600">{blocker.scheduleImpactDays} dias de impacto - Resp.: {project.manager.name}</span></li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </ReportPanel>
        </div>

        <ReportPanel title="Evolucao Macro do Projeto (Curva S)" className="mt-6" icon={<FileBarChart size={17} className="text-cyan-600" />}>
          <CurveSChart data={curveSData} planned={plannedProgress} actual={progress} />
        </ReportPanel>

        <ReportPanel title="Cronograma e Avanco por Fase (Gantt)" className="mt-6" icon={<FileBarChart size={17} className="text-cyan-600" />}>
          <div className="mb-4 flex items-center justify-between text-sm">
            <strong>Visao do Projeto no Tempo</strong>
            <span>Contrato: {formatDate(project.plannedStart)} a {formatDate(project.currentEnd)} - {businessDays} dias uteis</span>
          </div>
          <div className="space-y-5">
            {topLevelTasks.map((task) => (
              <div key={task.id}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{task.name} ({Number(task.progressPercent)}%)</span>
                  <span>{formatDate(task.plannedEnd)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${task.status === "DONE" ? "bg-cyan-500" : task.plannedEnd < new Date() ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${Math.min(100, Number(task.progressPercent))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>

        <ReportPanel title="Esforco e Alocacao por Recurso (Horas)" className="mt-6" icon={<FileBarChart size={17} className="text-cyan-600" />}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Recurso / Frente</th>
                <th className="py-2 text-right">Planejado</th>
                <th className="py-2 text-right">Realizado</th>
                <th className="py-2">Consumo do orcamento</th>
                <th className="py-2 text-right">Saude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {resourceRows.map((row) => (
                <tr key={row.name}>
                  <td className="py-3"><strong>{row.name}</strong><p className="text-xs text-slate-500">{row.role}</p></td>
                  <td className="py-3 text-right">{formatHours(row.planned)}</td>
                  <td className="py-3 text-right font-bold">{formatHours(row.actual)}</td>
                  <td className="py-3">
                    <div className="mb-1 flex justify-between text-xs"><span>{row.consumption}% consumido</span><span>{row.actual > row.planned ? `Estouro: ${formatHours(row.actual - row.planned)}` : `Restam ${formatHours(row.planned - row.actual)}`}</span></div>
                    <div className="h-1.5 rounded-full bg-slate-200"><div className={`h-full rounded-full ${row.actual > row.planned ? "bg-red-500" : "bg-cyan-500"}`} style={{ width: `${Math.min(100, row.consumption)}%` }} /></div>
                  </td>
                  <td className="py-3 text-right"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${row.actual > row.planned ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{row.actual > row.planned ? "Estourado" : "Dentro da meta"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportPanel>

        <form action="/api/export" method="get" className="mt-6 rounded-lg border border-line bg-slate-50 p-5">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid grid-cols-[1fr_220px_auto] gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Relatorio
              <select name="reportType" className="h-10 rounded-md border border-line px-3">
                {reports.map(([type, title, description]) => (
                  <option key={type} value={type}>{title} - {description}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Formato
              <select name="format" className="h-10 rounded-md border border-line px-3">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="legacy-csv">CSV legado</option>
                <option value="mspdi">MSPDI XML</option>
              </select>
            </label>
            <button className="mt-6 h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white">
              Exportar
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

type HealthTone = "blue" | "green" | "amber" | "orange" | "red" | "rose";

function MetricTile({ title, value, detail, footer, tone = "blue" }: { title: string; value: string; detail: string; footer?: string; tone?: HealthTone }) {
  const toneClass = {
    blue: "text-ink",
    green: "text-emerald-700",
    amber: "text-amber-700",
    orange: "text-orange-700",
    red: "text-red-700",
    rose: "text-rose-800"
  }[tone];
  const bgClass = {
    blue: "border-slate-300 bg-white",
    green: "border-emerald-200 bg-emerald-50/50",
    amber: "border-amber-200 bg-amber-50/60",
    orange: "border-orange-200 bg-orange-50/60",
    red: "border-red-200 bg-red-50/60",
    rose: "border-rose-300 bg-rose-50/70"
  }[tone];

  return (
    <div className={`min-h-36 rounded-lg border p-4 shadow-sm ${bgClass}`}>
      <p className="text-xs font-black uppercase">{title}</p>
      <p className={`mt-3 break-words text-2xl font-black leading-tight ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-bold">{detail}</p>
      {footer ? <p className="mt-3 text-xs text-slate-600">{footer}</p> : null}
    </div>
  );
}

function ReportPanel({ title, icon, className = "", children }: { title: string; icon: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={className}>
      <h3 className="mb-2 flex items-center gap-2 text-lg font-black text-ink">{icon}{title}</h3>
      <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">{children}</div>
    </section>
  );
}

type CurveSPoint = {
  date: Date;
  label: string;
  planned: number;
  actual: number;
};

function CurveSChart({ data, planned, actual }: { data: CurveSPoint[]; planned: number; actual: number }) {
  const chart = { left: 70, right: 850, top: 24, bottom: 180 };
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const points = data.length ? data : [{ date: new Date(), label: "Hoje", planned, actual }];
  const xFor = (index: number) => chart.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * width);
  const yFor = (value: number) => chart.bottom - (Math.max(0, Math.min(100, value)) / 100) * height;
  const plannedPath = points.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)} ${yFor(point.planned).toFixed(1)}`).join(" ");
  const actualPath = points.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)} ${yFor(point.actual).toFixed(1)}`).join(" ");
  const todayIndex = points.findIndex((point) => point.label === "Hoje");
  const last = points[points.length - 1];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-cyan-500" />Planejado acumulado</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-emerald-500" />Realizado acumulado</span>
        <span className="ml-auto">Hoje: planejado {planned}% | realizado {actual}%</span>
      </div>
      <svg viewBox="0 0 900 230" className="h-72 w-full">
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line x1={chart.left} x2={chart.right} y1={yFor(value)} y2={yFor(value)} stroke="#dbe4ef" />
            <text x="28" y={yFor(value) + 4} fontSize="11" fill="#64748b">{value}%</text>
          </g>
        ))}
        <line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.bottom} stroke="#cbd5e1" />
        <line x1={chart.left} x2={chart.right} y1={chart.bottom} y2={chart.bottom} stroke="#cbd5e1" />
        {todayIndex >= 0 ? <line x1={xFor(todayIndex)} x2={xFor(todayIndex)} y1={chart.top} y2={chart.bottom} stroke="#94a3b8" strokeDasharray="4 5" /> : null}
        <path d={plannedPath} fill="none" stroke="#16add3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <path d={actualPath} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={xFor(index)} cy={yFor(point.planned)} r="2.5" fill="#16add3" />
            <circle cx={xFor(index)} cy={yFor(point.actual)} r="2.5" fill="#10b981" />
          </g>
        ))}
        <text x={chart.left} y="210" fontSize="12" fill="#64748b">{points[0]?.label ?? "Inicio"}</text>
        <text x={chart.right - 90} y="210" fontSize="12" fill="#64748b">{last?.label ?? "Fim"}</text>
        {todayIndex >= 0 ? <text x={xFor(todayIndex) + 6} y="42" fontSize="11" fill="#64748b">Hoje</text> : null}
      </svg>
      <p className="mt-2 text-xs text-slate-500">
        Planejado: horas estimadas distribuidas entre inicio e fim planejados. Realizado: valor agregado atual por conclusao/progresso das tarefas.
      </p>
    </div>
  );
}

function buildCurveSData(tasks: ReportTask[], projectStart: Date, projectEnd: Date): CurveSPoint[] {
  const validTasks = tasks.filter((task) => task.plannedStart && task.plannedEnd);
  if (!validTasks.length) return [];

  const today = new Date();
  const start = new Date(Math.min(projectStart.getTime(), ...validTasks.map((task) => task.plannedStart.getTime())));
  const end = new Date(Math.max(projectEnd.getTime(), today.getTime(), ...validTasks.map((task) => task.plannedEnd.getTime())));
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const stepDays = Math.max(1, Math.ceil(totalDays / 28));
  const dates: Date[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + stepDays)) {
    dates.push(new Date(cursor));
  }
  dates.push(today, end);

  const uniqueDates = [...new Map(dates.map((date) => [date.toISOString().slice(0, 10), date])).values()]
    .sort((left, right) => left.getTime() - right.getTime());
  const totalWeight = validTasks.reduce((sum, task) => sum + taskWeight(task), 0) || validTasks.length || 1;

  return uniqueDates.map((date) => {
    const plannedValue = validTasks.reduce((sum, task) => sum + plannedEarnedForDate(task, date), 0);
    const actualValue = validTasks.reduce((sum, task) => sum + actualEarnedForDate(task, date, today), 0);
    return {
      date,
      label: sameDay(date, today) ? "Hoje" : formatDate(date),
      planned: Math.round((plannedValue / totalWeight) * 100),
      actual: Math.round((actualValue / totalWeight) * 100)
    };
  });
}

function plannedEarnedForDate(task: ReportTask, date: Date) {
  const weight = taskWeight(task);
  const start = task.plannedStart.getTime();
  const end = Math.max(start + 1, task.plannedEnd.getTime());
  const current = date.getTime();
  if (current <= start) return 0;
  if (current >= end) return weight;
  return weight * ((current - start) / (end - start));
}

function actualEarnedForDate(task: ReportTask, date: Date, today: Date) {
  const progress = actualProgressPercent(task);
  if (progress <= 0) return 0;
  const earned = taskWeight(task) * (progress / 100);
  const recognitionDate = task.status === "DONE" ? (task.actualEnd ?? task.plannedEnd) : today;
  return date.getTime() >= recognitionDate.getTime() ? earned : 0;
}

function taskWeight(task: ReportTask) {
  const estimated = Number(task.estimatedHours ?? 0);
  return estimated > 0 ? estimated : 1;
}

function actualProgressPercent(task: ReportTask) {
  const progress = Number(task.progressPercent ?? 0);
  const estimated = Number(task.estimatedHours ?? 0);
  const actualHours = Number(task.actualHours ?? 0);
  const hoursProgress = estimated > 0 ? (actualHours / estimated) * 100 : 0;
  if (task.status === "DONE") return 100;
  return Math.min(100, Math.max(0, progress, hoursProgress));
}

function sameDay(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function finalTasks(tasks: ReportTask[]) {
  const parentIds = new Set(tasks.map((task) => task.parentTaskId).filter(Boolean));
  const leaves = tasks.filter((task) => !parentIds.has(task.id));
  return leaves.length ? leaves : tasks;
}

function isDueWithinOneDay(task: ReportTask) {
  if (task.status === "DONE") return false;
  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return task.plannedEnd >= now && task.plannedEnd <= inOneDay;
}

function getScheduleHealth(delayedCount: number, dueSoonCount: number) {
  if (delayedCount > 10) {
    return {
      label: "Replanejamento Urgente",
      description: "Mais de 10 atividades atrasadas exigem replanejamento imediato",
      tone: "rose" as const,
      textClass: "text-rose-800",
      softClass: "border-rose-200 bg-rose-50 text-rose-800"
    };
  }
  if (delayedCount > 5) {
    return {
      label: "Alto",
      description: "Entre 6 e 10 atividades atrasadas",
      tone: "red" as const,
      textClass: "text-red-700",
      softClass: "border-red-200 bg-red-50 text-red-700"
    };
  }
  if (delayedCount > 3) {
    return {
      label: "Medio",
      description: "Entre 4 e 5 atividades atrasadas",
      tone: "orange" as const,
      textClass: "text-orange-700",
      softClass: "border-orange-200 bg-orange-50 text-orange-700"
    };
  }
  if (delayedCount > 0) {
    return {
      label: "Baixo risco",
      description: "Ate 3 atividades atrasadas",
      tone: "amber" as const,
      textClass: "text-amber-700",
      softClass: "border-amber-200 bg-amber-50 text-amber-700"
    };
  }
  if (dueSoonCount >= 3) {
    return {
      label: "Atencao",
      description: "Pelo menos 3 atividades vencem em ate 1 dia",
      tone: "amber" as const,
      textClass: "text-amber-700",
      softClass: "border-amber-200 bg-amber-50 text-amber-700"
    };
  }

  return {
    label: "Saudavel",
    description: "Todas as atividades estao dentro do prazo",
    tone: "green" as const,
    textClass: "text-emerald-700",
    softClass: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };
}

function resourceEffortRows(tasks: ReportTask[]) {
  const rows = new Map<string, { name: string; role: string; planned: number; actual: number }>();
  for (const task of tasks) {
    const name = task.owner?.name ?? "Sem responsavel";
    const row = rows.get(name) ?? { name, role: task.owner?.jobTitle ?? "Frente nao informada", planned: 0, actual: 0 };
    row.planned += Number(task.estimatedHours ?? 0);
    row.actual += Number(task.actualHours ?? 0);
    rows.set(name, row);
  }

  return [...rows.values()]
    .map((row) => ({ ...row, consumption: row.planned > 0 ? Math.round((row.actual / row.planned) * 100) : 0 }))
    .sort((left, right) => right.actual - left.actual)
    .slice(0, 8);
}

function currentPhase(tasks: ReportTask[]) {
  const active = tasks.find((task) => task.status !== "DONE" && (task.wbsCode?.split(".").length ?? 1) <= 2);
  return active?.name ?? "Fase nao informada";
}

function plannedProgressForToday(start: Date, end: Date) {
  const total = Math.max(1, end.getTime() - start.getTime());
  const elapsed = Math.min(total, Math.max(0, new Date().getTime() - start.getTime()));
  return Math.round((elapsed / total) * 100);
}

function countBusinessDays(start: Date, end: Date) {
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function compareWbsCodes(left?: string | null, right?: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? -1) - (rightParts[index] ?? -1);
    if (diff !== 0) return diff;
  }
  return left.localeCompare(right);
}
