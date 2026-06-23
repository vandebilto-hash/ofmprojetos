import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectExecutiveDashboard } from "@/features/dashboard/project-executive-dashboard";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";

const taskStatusLabel: Record<string, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  IN_REVIEW: "Em validação",
  BLOCKED: "Bloqueada",
  DONE: "Concluída"
};

const riskClassificationLabel: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
  CRITICAL: "Crítico"
};

export default async function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { tasks: true, risks: true, blockers: true, milestones: true, todos: true, stakeholders: true, documents: true }
  });
  if (!project) notFound();

  const now = new Date();
  const completedTasks = project.tasks.filter((task) => task.status === "DONE").length;
  const delayedTasks = project.tasks.filter((task) => task.status !== "DONE" && task.plannedEnd < now);
  const priorityRisks = project.risks.filter((risk) => risk.classification === "CRITICAL" || risk.classification === "HIGH");
  const openBlockers = project.blockers.filter((blocker) => blocker.status !== "RESOLVED");
  const openActions = project.todos.filter((todo) => todo.status !== "DONE");
  const completedMilestones = project.milestones.filter((item) => item.status === "COMPLETED").length;
  const progress = Number(project.progressPercent);

  const cards = [
    { label: "Avanço do projeto", value: `${progress}%`, detail: "percentual consolidado", tone: "blue" },
    { label: "Horas planejadas", value: formatHours(project.plannedHours), detail: `${formatHours(project.actualHours)} executadas`, tone: "emerald" },
    { label: "Atividades atrasadas", value: delayedTasks.length, detail: `${completedTasks} de ${project.tasks.length} concluídas`, tone: delayedTasks.length ? "red" : "emerald" },
    { label: "Riscos altos/críticos", value: priorityRisks.length, detail: `${project.risks.length} riscos cadastrados`, tone: priorityRisks.length ? "amber" : "slate" },
    { label: "Bloqueios abertos", value: openBlockers.length, detail: `${project.blockers.length} bloqueios cadastrados`, tone: openBlockers.length ? "red" : "emerald" },
    { label: "Ações abertas", value: openActions.length, detail: `${project.todos.length} ações cadastradas`, tone: openActions.length ? "amber" : "emerald" },
    { label: "Marcos", value: project.milestones.length, detail: `${completedMilestones} concluídos`, tone: "violet" },
    { label: "Partes interessadas", value: project.stakeholders.length, detail: "governança do projeto", tone: "slate" }
  ];
  const statusData = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].map((status) => ({
    name: taskStatusLabel[status],
    value: project.tasks.filter((task) => task.status === status).length
  }));
  const riskData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((classification) => ({
    name: riskClassificationLabel[classification],
    value: project.risks.filter((risk) => risk.classification === classification).length
  }));
  const hoursData = [{ name: "Projeto", planejadas: Number(project.plannedHours), executadas: Number(project.actualHours) }];
  const attentionTasks = delayedTasks.slice(0, 5);
  const attentionRisks = priorityRisks.slice(0, 5);

  return (
    <>
      <PageHeader title={`Painel executivo | ${project.name}`} description="Indicadores consolidados para acompanhamento executivo do projeto." />
      <ProjectTabs projectId={project.id} />

      <section className="mb-5 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line bg-gradient-to-r from-brand-50 via-white to-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">Visão executiva</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Saúde geral do projeto em uma tela</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Acompanhe avanço, horas, riscos, bloqueios, ações, marcos e governança com leitura rápida e sem códigos em inglês.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <ProjectExecutiveDashboard statusData={statusData} riskData={riskData} hoursData={hoursData} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-ink">Pontos de atenção do cronograma</h2>
              <p className="text-sm text-slate-500">Atividades atrasadas que precisam de acompanhamento.</p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{attentionTasks.length} item(ns)</span>
          </div>
          <div className="mt-4 grid gap-3">
            {attentionTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-red-100 bg-red-50/40 p-3 text-sm">
                <strong>{task.name}</strong>
                <p className="mt-1 text-slate-600">Prazo: {formatDate(task.plannedEnd)} | Progresso: {Number(task.progressPercent)}%</p>
              </div>
            ))}
            {!attentionTasks.length ? <p className="text-sm text-slate-500">Nenhuma atividade atrasada.</p> : null}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-ink">Riscos executivos prioritários</h2>
              <p className="text-sm text-slate-500">Riscos altos e críticos que exigem decisão.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{attentionRisks.length} item(ns)</span>
          </div>
          <div className="mt-4 grid gap-3">
            {attentionRisks.map((risk) => (
              <div key={risk.id} className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 text-sm">
                <div className="flex justify-between gap-3"><strong>{risk.name}</strong><span className="font-bold text-amber-700">{riskClassificationLabel[risk.classification]}</span></div>
                <p className="mt-1 text-slate-500">{risk.impact ?? risk.description}</p>
              </div>
            ))}
            {!attentionRisks.length ? <p className="text-sm text-slate-500">Nenhum risco alto ou crítico.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) {
  const toneClass: Record<string, string> = {
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    red: "border-red-100 bg-red-50/70 text-red-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    violet: "border-violet-100 bg-violet-50/70 text-violet-800",
    slate: "border-slate-100 bg-slate-50 text-slate-800"
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClass[tone] ?? toneClass.slate}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
      <p className="mt-2 text-xs font-semibold opacity-75">{detail}</p>
    </div>
  );
}
