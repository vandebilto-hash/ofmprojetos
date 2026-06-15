"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { criticalPath } from "@/lib/scheduling/critical-path";
import { formatDate } from "@/lib/format";

type Task = {
  id: string;
  name: string;
  status: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  plannedDuration: number;
  progressPercent: unknown;
};

type Baseline = {
  id: string;
  name: string;
  isActive: boolean;
  tasks: {
    taskId: string;
    plannedStart: Date | string;
    plannedEnd: Date | string;
  }[];
};

type Dependency = {
  predecessorId: string;
  successorId: string;
};

const dayMs = 86400000;

export function GanttView({
  tasks,
  baselines = [],
  dependencies
}: {
  tasks: Task[];
  baselines?: Baseline[];
  dependencies?: Dependency[];
}) {
  const [dayWidth, setDayWidth] = useState(28);

  const normalized = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        plannedStart: new Date(task.plannedStart),
        plannedEnd: new Date(task.plannedEnd)
      })),
    [tasks]
  );

  if (!normalized.length) {
    return <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">Sem tarefas para exibir.</div>;
  }

  const allDates = [
    ...normalized.flatMap((task) => [task.plannedStart.getTime(), task.plannedEnd.getTime()]),
    ...baselines.flatMap((baseline) =>
      baseline.tasks.flatMap((task) => [new Date(task.plannedStart).getTime(), new Date(task.plannedEnd).getTime()])
    )
  ];
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / dayMs) + 1);
  const timelineWidth = Math.max(720, totalDays * dayWidth);
  const critical = criticalPath(
    normalized.map((task) => ({ id: task.id, plannedDuration: task.plannedDuration })),
    dependencies ?? []
  );
  const now = new Date();

  function leftFor(date: Date | string) {
    return Math.max(0, Math.round((new Date(date).getTime() - minDate.getTime()) / dayMs)) * dayWidth;
  }

  function widthFor(start: Date | string, end: Date | string) {
    return Math.max(dayWidth, (Math.round((new Date(end).getTime() - new Date(start).getTime()) / dayMs) + 1) * dayWidth);
  }

  return (
    <div className="rounded-lg border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="font-bold text-ink">Grafico de Gantt</h2>
          <p className="text-xs text-slate-500">
            {formatDate(minDate)} - {formatDate(maxDate)} | {baselines.length} baseline(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDayWidth((value) => Math.max(10, value - 6))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white hover:bg-slate-50"
            title="Reduzir zoom"
          >
            <Minus size={16} />
          </button>
          <span className="w-16 text-center text-xs font-semibold text-slate-600">{dayWidth}px/dia</span>
          <button
            type="button"
            onClick={() => setDayWidth((value) => Math.min(72, value + 6))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white hover:bg-slate-50"
            title="Aumentar zoom"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-4 border-b border-line px-4 py-2 text-xs text-slate-600">
        <span><span className="status-dot bg-brand-600" /> Atual</span>
        <span><span className="status-dot bg-red-500" /> Atrasada</span>
        <span><span className="status-dot bg-amber-500" /> Caminho critico</span>
        <span><span className="status-dot bg-slate-300" /> Baselines</span>
      </div>
      <div className="overflow-auto">
        <div className="grid min-w-max grid-cols-[320px_1fr]">
          <div className="sticky left-0 z-10 border-r border-line bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
            Tarefa
          </div>
          <div className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500" style={{ width: timelineWidth }}>
            Linha do tempo rolavel
          </div>
          {normalized.map((task) => {
            const delayed = task.plannedEnd < now && task.status !== "DONE";
            const isCritical = critical.has(task.id);
            const rowHeight = 52 + baselines.length * 14;

            return (
              <div key={task.id} className="contents">
                <div
                  className="sticky left-0 z-10 border-r border-t border-line bg-white px-3 py-3"
                  style={{ minHeight: rowHeight }}
                >
                  <p className="font-medium text-ink">{task.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(task.plannedStart)} - {formatDate(task.plannedEnd)}</p>
                </div>
                <div className="relative border-t border-line px-3" style={{ width: timelineWidth, minHeight: rowHeight }}>
                  <div className="absolute inset-x-3 top-1/2 h-px bg-slate-100" />
                  {baselines.map((baseline, index) => {
                    const baselineTask = baseline.tasks.find((item) => item.taskId === task.id);
                    if (!baselineTask) return null;
                    return (
                      <div
                        key={baseline.id}
                        className={`absolute h-2 rounded ${baseline.isActive ? "bg-slate-500" : "bg-slate-300"}`}
                        style={{
                          top: 10 + index * 13,
                          left: leftFor(baselineTask.plannedStart),
                          width: widthFor(baselineTask.plannedStart, baselineTask.plannedEnd)
                        }}
                        title={baseline.name}
                      />
                    );
                  })}
                  <div
                    className={`absolute h-6 rounded ${delayed ? "bg-red-500" : isCritical ? "bg-amber-500" : "bg-brand-600"}`}
                    style={{
                      top: 18 + baselines.length * 13,
                      left: leftFor(task.plannedStart),
                      width: widthFor(task.plannedStart, task.plannedEnd)
                    }}
                    title={isCritical ? "Caminho critico" : undefined}
                  >
                    <span
                      className="block h-full rounded bg-emerald-500/70"
                      style={{ width: `${Number(task.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
