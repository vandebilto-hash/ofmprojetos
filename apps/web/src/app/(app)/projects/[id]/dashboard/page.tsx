import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectExecutiveDashboard } from "@/features/dashboard/project-executive-dashboard";
import { ProjectTabs } from "@/features/projects/project-tabs";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";

export default async function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { tasks: true, risks: true, blockers: true, milestones: true, todos: true, stakeholders: true, documents: true }
  });
  if (!project) notFound();

  const cards = [
    ["Avanco do projeto", `${Number(project.progressPercent)}%`, "percentual consolidado"],
    ["Horas planejadas", formatHours(project.plannedHours), `${formatHours(project.actualHours)} executadas`],
    ["Atividades atrasadas", project.tasks.filter((task) => task.status !== "DONE" && task.plannedEnd < new Date()).length, `${project.tasks.length} atividades`],
    ["Riscos criticos/altos", project.risks.filter((risk) => risk.classification === "CRITICAL" || risk.classification === "HIGH").length, `${project.risks.length} riscos`],
    ["Bloqueios abertos", project.blockers.filter((blocker) => blocker.status !== "RESOLVED").length, `${project.blockers.length} bloqueios`],
    ["To-dos abertos", project.todos.filter((todo) => todo.status !== "DONE").length, `${project.todos.length} acoes`],
    ["Marcos", project.milestones.length, `${project.milestones.filter((item) => item.status === "COMPLETED").length} concluidos`],
    ["Stakeholders", project.stakeholders.length, "governanca"]
  ];
  const statusData = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].map((status) => ({
    name: status,
    value: project.tasks.filter((task) => task.status === status).length
  }));
  const riskData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((classification) => ({
    name: classification,
    value: project.risks.filter((risk) => risk.classification === classification).length
  }));
  const hoursData = [{ name: "Projeto", planejadas: Number(project.plannedHours), executadas: Number(project.actualHours) }];
  const attentionTasks = project.tasks.filter((task) => task.status !== "DONE" && task.plannedEnd < new Date()).slice(0, 5);
  const attentionRisks = project.risks.filter((risk) => risk.classification === "CRITICAL" || risk.classification === "HIGH").slice(0, 5);

  return (
    <>
      <PageHeader title={`Dashboard | ${project.name}`} description="Numeros consolidados para acompanhamento executivo do projeto." />
      <ProjectTabs projectId={project.id} />
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value, detail]) => (
          <div key={label} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </section>
      <section className="mt-5">
        <ProjectExecutiveDashboard statusData={statusData} riskData={riskData} hoursData={hoursData} />
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Pontos de atencao do cronograma</h2>
          <div className="mt-4 grid gap-3">
            {attentionTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-line p-3 text-sm">
                <strong>{task.name}</strong>
                <p className="mt-1 text-slate-500">Prazo {formatDate(task.plannedEnd)} | progresso {Number(task.progressPercent)}%</p>
              </div>
            ))}
            {!attentionTasks.length ? <p className="text-sm text-slate-500">Nenhuma atividade atrasada.</p> : null}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Top riscos executivos</h2>
          <div className="mt-4 grid gap-3">
            {attentionRisks.map((risk) => (
              <div key={risk.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex justify-between gap-3"><strong>{risk.name}</strong><span className="font-bold text-red-700">{risk.classification}</span></div>
                <p className="mt-1 text-slate-500">{risk.impact ?? risk.description}</p>
              </div>
            ))}
            {!attentionRisks.length ? <p className="text-sm text-slate-500">Nenhum risco alto ou critico.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
