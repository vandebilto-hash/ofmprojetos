"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Minus, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { criticalPath } from "@/lib/scheduling/critical-path";
import { formatDate } from "@/lib/format";

type Task = {
  id: string;
  parentTaskId?: string | null;
  name: string;
  status: string;
  wbsCode?: string | null;
  outlineLevel?: number;
  children?: Array<{ id: string }>;
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
const defaultDayWidth = 20;
const defaultEdtWidth = 260;

export function GanttView({
  tasks,
  baselines = [],
  dependencies
}: {
  tasks: Task[];
  baselines?: Baseline[];
  dependencies?: Dependency[];
}) {
  const [dayWidth, setDayWidth] = useState(defaultDayWidth);
  const [showEdt, setShowEdt] = useState(true);
  const [edtWidth, setEdtWidth] = useState(defaultEdtWidth);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

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
  const taskById = new Map(normalized.map((task) => [task.id, task]));
  const visibleTasks = normalized.filter((task) => {
    let currentParentId = task.parentTaskId;
    while (currentParentId) {
      if (collapsedIds.has(currentParentId)) return false;
      currentParentId = taskById.get(currentParentId)?.parentTaskId;
    }
    return true;
  });
  const now = new Date();

  function leftFor(date: Date | string) {
    return Math.max(0, Math.round((new Date(date).getTime() - minDate.getTime()) / dayMs)) * dayWidth;
  }

  function widthFor(start: Date | string, end: Date | string) {
    return Math.max(dayWidth, (Math.round((new Date(end).getTime() - new Date(start).getTime()) / dayMs) + 1) * dayWidth);
  }

  function toggleCollapsed(taskId: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <div className="w-full max-w-full overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="font-bold text-ink">Grafico de Gantt</h2>
          <p className="text-xs text-slate-500">
            {formatDate(minDate)} - {formatDate(maxDate)} | {baselines.length} baseline(s) | {visibleTasks.length} atividade(s) visivel(is)
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowEdt((value) => !value)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            title={showEdt ? "Ocultar EDT" : "Mostrar EDT"}
          >
            {showEdt ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            {showEdt ? "Ocultar EDT" : "Mostrar EDT"}
          </button>
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2 text-xs text-slate-600">
        <div className="flex flex-wrap gap-4">
          <span><span className="status-dot bg-brand-600" /> Atual</span>
          <span><span className="status-dot bg-red-500" /> Atrasada</span>
          <span><span className="status-dot bg-amber-500" /> Caminho critico</span>
          <span><span className="status-dot bg-slate-300" /> Baselines</span>
        </div>
        {showEdt ? (
          <label className="flex items-center gap-2 font-semibold text-slate-500">
            Largura EDT
            <input
              type="range"
              min="180"
              max="320"
              value={edtWidth}
              onChange={(event) => setEdtWidth(Number(event.target.value))}
              className="w-32 accent-brand-600"
            />
            <span className="w-11 text-right tabular-nums">{edtWidth}px</span>
          </label>
        ) : null}
      </div>
      <div className="h-[420px] max-h-[520px] min-h-[280px] w-full max-w-full resize-y overflow-auto border-b border-line">
        <div className="grid min-w-max" style={{ gridTemplateColumns: showEdt ? `${edtWidth}px 1fr` : "0px 1fr" }}>
          {showEdt ? (
            <div className="sticky left-0 z-10 border-r border-line bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              EDT / Tarefa
            </div>
          ) : (
            <div className="w-0 overflow-hidden" />
          )}
          <div className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500" style={{ width: timelineWidth }}>
            Linha do tempo rolavel
          </div>
          {visibleTasks.map((task) => {
            const delayed = task.plannedEnd < now && task.status !== "DONE";
            const isCritical = critical.has(task.id);
            const rowHeight = 44 + baselines.length * 12;
            const hasChildren = Boolean(task.children?.length);
            const isCollapsed = collapsedIds.has(task.id);

            return (
              <div key={task.id} className="contents">
                {showEdt ? (
                  <div
                    className="sticky left-0 z-10 border-r border-t border-line bg-white px-2 py-2"
                    style={{ minHeight: rowHeight }}
                  >
                    <div className="flex items-start gap-1" style={{ paddingLeft: `${Math.max(0, (task.outlineLevel ?? 1) - 1) * 10}px` }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(task.id)}
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line text-slate-500 hover:bg-slate-50"
                          title={isCollapsed ? "Abrir EDT" : "Fechar EDT"}
                        >
                          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : (
                        <span className="h-5 w-5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        {task.wbsCode ? <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{task.wbsCode}</p> : null}
                        <p className="truncate text-sm font-medium text-ink" title={task.name}>{task.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(task.plannedStart)} - {formatDate(task.plannedEnd)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-0 overflow-hidden border-t border-line" style={{ minHeight: rowHeight }} />
                )}
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
                          top: 8 + index * 11,
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
                      top: 14 + baselines.length * 11,
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
      <div className="flex items-center justify-center bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Arraste a borda inferior do quadro para limitar ou ampliar a area visivel
      </div>
    </div>
  );
}
