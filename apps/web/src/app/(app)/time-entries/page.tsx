import { PageHeader } from "@/components/ui/page-header";
import { createTimeEntryAction } from "@/server/actions/time-entries";
import { formatDate, formatHours } from "@/lib/format";
import { prisma } from "@/lib/prisma/client";

export default async function TimeEntriesPage() {
  const [tasks, entries] = await Promise.all([
    prisma.task.findMany({ include: { project: true }, orderBy: { name: "asc" } }),
    prisma.timeEntry.findMany({ include: { task: true, project: true, user: true }, orderBy: { date: "desc" } })
  ]);

  return (
    <>
      <PageHeader title="Apontamento de horas" description="Horas trabalhadas alimentam tarefas, projetos, custos e indicadores." />
      <form action={createTimeEntryAction} className="mb-4 grid grid-cols-[1.4fr_150px_120px_1fr_auto] gap-3 rounded-lg border border-line bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
        <select name="taskId" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white">
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.project.name} / {task.name}
            </option>
          ))}
        </select>
        <input name="date" type="date" required className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white" />
        <input name="hours" type="number" step="0.5" min="0.5" required placeholder="Horas" className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" />
        <input name="description" placeholder="Trabalho realizado" required className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500" />
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Apontar</button>
      </form>
      <div className="grid gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-md border border-line bg-white p-3 text-sm shadow-sm">
            <strong>{entry.user.name}</strong> | {entry.project.name} / {entry.task.name} | {formatDate(entry.date)} | {formatHours(entry.hours)}
          </div>
        ))}
      </div>
    </>
  );
}
