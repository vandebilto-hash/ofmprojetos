"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { DialogAction } from "@/components/ui/dialog-action";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatHours } from "@/lib/format";
import { deleteTaskAction, updateTaskAction } from "@/server/actions/projects";
import { createTimeEntryAction } from "@/server/actions/time-entries";

type UserOption = { id: string; name: string };

type ManagedTask = {
  id: string;
  projectId: string;
  parentTaskId?: string | null;
  name: string;
  description: string | null;
  wbsCode?: string | null;
  outlineLevel?: number;
  children?: Array<{ id: string }>;
  ownerId: string | null;
  owner?: { name: string } | null;
  status: string;
  priority: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  actualEnd?: Date | string | null;
  estimatedHours: unknown;
  actualHours: unknown;
  progressPercent: unknown;
  predecessors?: Array<{ predecessorId: string; predecessor: { id: string; name: string } }>;
  project?: { name: string } | null;
};

const statuses = [
  ["TODO", "A fazer"],
  ["IN_PROGRESS", "Em andamento"],
  ["IN_REVIEW", "Em validacao"],
  ["BLOCKED", "Bloqueado"],
  ["DONE", "Concluido"]
];

const priorities = [
  ["LOW", "Baixa"],
  ["MEDIUM", "Media"],
  ["HIGH", "Alta"],
  ["CRITICAL", "Critica"]
];

function inputDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getAncestorWbsCodes(wbsCode?: string | null) {
  if (!wbsCode?.includes(".")) return [];

  const parts = wbsCode.split(".");
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("."));
}

function compareWbsCodes(left?: string | null, right?: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? -1;
    const rightValue = rightParts[index] ?? -1;
    if (leftValue !== rightValue) return leftValue - rightValue;
  }

  return left.localeCompare(right);
}

export function TaskManagementTable({
  tasks,
  users,
  showProject = false,
  canPointForOthers = false,
  currentUserId,
  defaultCollapsed = false
}: {
  tasks: ManagedTask[];
  users: UserOption[];
  showProject?: boolean;
  canPointForOthers?: boolean;
  currentUserId?: string;
  defaultCollapsed?: boolean;
}) {
  const now = new Date();
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(() => new Set());
  const initializedDefaultCollapse = useRef(false);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const descendantIdsByTaskId = useMemo(() => {
    const directChildren = new Map<string, string[]>();
    for (const task of tasks) {
      if (task.parentTaskId) {
        directChildren.set(task.parentTaskId, [...(directChildren.get(task.parentTaskId) ?? []), task.id]);
      }

      for (const child of task.children ?? []) {
        directChildren.set(task.id, [...(directChildren.get(task.id) ?? []), child.id]);
      }
    }

    const descendants = new Map<string, string[]>();
    function collect(taskId: string): string[] {
      if (descendants.has(taskId)) return descendants.get(taskId)!;
      const ids = [...new Set(directChildren.get(taskId) ?? [])];
      const allIds = ids.flatMap((id) => [id, ...collect(id)]);
      descendants.set(taskId, allIds);
      return allIds;
    }

    tasks.forEach((task) => collect(task.id));
    return descendants;
  }, [tasks]);
  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((left, right) => {
        const wbsOrder = compareWbsCodes(left.wbsCode, right.wbsCode);
        if (wbsOrder !== 0) return wbsOrder;

        const projectOrder = String(left.project?.name ?? left.projectId).localeCompare(String(right.project?.name ?? right.projectId));
        if (projectOrder !== 0) return projectOrder;

        return new Date(left.plannedStart).getTime() - new Date(right.plannedStart).getTime();
      }),
    [tasks]
  );
  const taskIdByWbs = useMemo(
    () => new Map(tasks.filter((task) => task.wbsCode).map((task) => [String(task.wbsCode), task.id])),
    [tasks]
  );
  const summaryTaskIds = useMemo(() => tasks.filter((task) => task.children?.length).map((task) => task.id), [tasks]);

  useEffect(() => {
    if (!defaultCollapsed || initializedDefaultCollapse.current || !summaryTaskIds.length) return;
    setCollapsedTaskIds(new Set(summaryTaskIds));
    initializedDefaultCollapse.current = true;
  }, [defaultCollapsed, summaryTaskIds]);

  function isTaskHidden(task: ManagedTask) {
    const wbsAncestorIds = getAncestorWbsCodes(task.wbsCode)
      .map((wbsCode) => taskIdByWbs.get(wbsCode))
      .filter(Boolean) as string[];

    let parentTaskId = task.parentTaskId ?? null;
    const parentAncestorIds: string[] = [];
    while (parentTaskId) {
      parentAncestorIds.push(parentTaskId);
      parentTaskId = taskById.get(parentTaskId)?.parentTaskId ?? null;
    }

    return [...wbsAncestorIds, ...parentAncestorIds].some((ancestorId) => collapsedTaskIds.has(ancestorId));
  }

  function toggleTask(taskId: string) {
    setCollapsedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function collapseAll() {
    setCollapsedTaskIds(new Set(summaryTaskIds));
  }

  function expandAll() {
    setCollapsedTaskIds(new Set());
  }

  function taskRollup(task: ManagedTask) {
    const descendants = (descendantIdsByTaskId.get(task.id) ?? [])
      .map((id) => taskById.get(id))
      .filter(Boolean) as ManagedTask[];
    const rollupTasks = descendants.length ? descendants.filter((item) => !(item.children?.length)) : [task];
    const estimatedHours = rollupTasks.reduce((sum, item) => sum + Number(item.estimatedHours ?? 0), 0);
    const actualHours = rollupTasks.reduce((sum, item) => sum + Number(item.actualHours ?? 0), 0);
    const progressPercent = estimatedHours > 0
      ? Math.round((rollupTasks.reduce((sum, item) => sum + Number(item.progressPercent ?? 0) * Number(item.estimatedHours ?? 0), 0) / estimatedHours) * 100) / 100
      : Number(task.progressPercent ?? 0);

    return { estimatedHours, actualHours, progressPercent };
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-soft">
      {summaryTaskIds.length ? (
        <div className="flex items-center justify-between border-b border-line bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
          <span className="font-semibold uppercase text-slate-500">
            Estrutura EDT com {summaryTaskIds.length} tarefa(s) principal(is)
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={expandAll} className="rounded-md border border-line bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-brand-50 dark:bg-slate-950 dark:text-slate-100">
              Expandir tudo
            </button>
            <button type="button" onClick={collapseAll} className="rounded-md border border-line bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-brand-50 dark:bg-slate-950 dark:text-slate-100">
              Recolher tudo
            </button>
          </div>
        </div>
      ) : null}
      <table className="min-w-[1160px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="w-24 px-3 py-3">EDT</th>
            <th className="px-3 py-3">Tarefa</th>
            {showProject ? <th className="px-3 py-3">Projeto</th> : null}
            <th className="px-3 py-3">Responsavel</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Prioridade</th>
            <th className="px-3 py-3">Inicio</th>
            <th className="px-3 py-3">Data fim planejada</th>
            <th className="px-3 py-3">Data fim real</th>
            <th className="px-3 py-3">Horas</th>
            <th className="px-3 py-3">Avanco</th>
            <th className="px-3 py-3">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orderedTasks.map((task) => {
            if (isTaskHidden(task)) return null;

            const delayed = new Date(task.plannedEnd) < now && task.status !== "DONE";
            const isSummary = Boolean(task.children?.length);
            const isCollapsed = collapsedTaskIds.has(task.id);
            const level = Math.max(1, Number(task.outlineLevel ?? task.wbsCode?.split(".").length ?? 1));
            const rollup = taskRollup(task);
            return (
              <tr
                key={task.id}
                className={
                  isSummary
                    ? "bg-slate-50/80 font-semibold dark:bg-slate-800/60"
                    : delayed
                      ? "bg-red-50/70 dark:bg-red-500/10"
                      : ""
                }
              >
                <td className="px-3 py-3 font-mono text-xs text-slate-500">
                  {task.wbsCode ?? "-"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2" style={{ paddingLeft: `${Math.max(0, level - 1) * 22}px` }}>
                    {isSummary ? (
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-ink dark:hover:bg-slate-700"
                        title={isCollapsed ? "Expandir subtarefas" : "Recolher subtarefas"}
                        aria-label={isCollapsed ? "Expandir subtarefas" : "Recolher subtarefas"}
                      >
                        {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                      </button>
                    ) : (
                      <span className="w-6 shrink-0" />
                    )}
                    <p className={isSummary ? "font-bold text-ink" : "font-semibold"}>{task.name}</p>
                  </div>
                  <p className="mt-1 max-w-md truncate text-xs text-slate-500">{task.description}</p>
                  {task.predecessors?.length ? (
                    <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                      Pred.: {task.predecessors.map((dependency) => dependency.predecessor.name).join(", ")}
                    </p>
                  ) : null}
                </td>
                {showProject ? <td className="px-3 py-3">{task.project?.name ?? "-"}</td> : null}
                <td className="px-3 py-3">{task.owner?.name ?? "-"}</td>
                <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                <td className="px-3 py-3"><StatusBadge status={task.priority} /></td>
                <td className="px-3 py-3">{formatDate(task.plannedStart)}</td>
                <td className="px-3 py-3">{formatDate(task.plannedEnd)}</td>
                <td className="px-3 py-3">{formatDate(task.actualEnd)}</td>
                <td className="px-3 py-3">{formatHours(rollup.actualHours)} / {formatHours(rollup.estimatedHours)}</td>
                <td className="px-3 py-3">{rollup.progressPercent}%</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end">
                    <ActionDropdown label={`Acoes da tarefa ${task.name}`}>
                    <DialogAction title={`Editar tarefa`} description={task.name} trigger="edit" triggerLabel="Editar tarefa" triggerVariant="menu">
                      <form action={updateTaskAction} className="grid gap-3">
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="projectId" value={task.projectId} />
                        <label className="grid gap-1 text-sm font-medium">
                          Nome
                          <input name="name" defaultValue={task.name} className="h-10 rounded-md border border-line px-3" />
                        </label>
                        <label className="grid gap-1 text-sm font-medium">
                          Descricao
                          <textarea name="description" defaultValue={task.description ?? ""} rows={3} className="rounded-md border border-line px-3 py-2" />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1 text-sm font-medium">
                            Responsavel
                            <select name="ownerId" defaultValue={task.ownerId ?? ""} className="h-10 rounded-md border border-line px-3">
                              <option value="">Sem responsavel</option>
                              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                          </label>
                          <label className="grid gap-1 text-sm font-medium">
                            Status
                            <select name="status" defaultValue={task.status} className="h-10 rounded-md border border-line px-3">
                              {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </label>
                        </div>
                        <label className="grid gap-1 text-sm font-medium">
                          Predecessoras
                          <select
                            name="predecessorIds"
                            multiple
                            defaultValue={task.predecessors?.map((dependency) => dependency.predecessorId) ?? []}
                            className="min-h-24 rounded-md border border-line px-3 py-2 text-sm"
                          >
                            {tasks
                              .filter((option) => option.id !== task.id)
                              .map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                          </select>
                          <span className="text-xs font-normal text-slate-500">
                            Segure Ctrl para selecionar mais de uma. Mudancas nas predecessoras reajustam esta tarefa e suas sucessoras.
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1 text-sm font-medium">
                            Prioridade
                            <select name="priority" defaultValue={task.priority} className="h-10 rounded-md border border-line px-3">
                              {priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </label>
                          <label className="grid gap-1 text-sm font-medium">
                            Avanco %
                            <input name="progressPercent" type="number" min="0" max="100" defaultValue={Number(task.progressPercent)} className="h-10 rounded-md border border-line px-3" />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1 text-sm font-medium">
                            Inicio
                            <input name="plannedStart" type="date" defaultValue={inputDate(task.plannedStart)} className="h-10 rounded-md border border-line px-3" />
                          </label>
                          <label className="grid gap-1 text-sm font-medium">
                            Fim
                            <input name="plannedEnd" type="date" defaultValue={inputDate(task.plannedEnd)} className="h-10 rounded-md border border-line px-3" />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1 text-sm font-medium">
                            Horas estimadas
                            <input name="estimatedHours" type="number" step="0.5" defaultValue={Number(task.estimatedHours)} className="h-10 rounded-md border border-line px-3" />
                          </label>
                          <label className="grid gap-1 text-sm font-medium">
                            Horas realizadas
                            <input name="actualHours" type="number" step="0.5" defaultValue={Number(task.actualHours)} className="h-10 rounded-md border border-line px-3" />
                          </label>
                        </div>
                        <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar tarefa</button>
                      </form>
                    </DialogAction>
                    <DialogAction title="Apontar horas" description={task.name} triggerLabel="Apontar horas" trigger="create" triggerVariant="menu">
                      <form action={createTimeEntryAction} className="grid gap-3">
                        <input type="hidden" name="taskId" value={task.id} />
                        <label className="grid gap-1 text-sm font-medium">
                          Colaborador
                          {canPointForOthers ? (
                            <select name="userId" defaultValue={task.ownerId ?? currentUserId ?? ""} className="h-10 rounded-md border border-line px-3">
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <input type="hidden" name="userId" value={currentUserId ?? ""} />
                              <input value={users.find((user) => user.id === currentUserId)?.name ?? "Meu usuario"} readOnly className="h-10 rounded-md border border-line px-3 text-slate-500" />
                            </>
                          )}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-1 text-sm font-medium">
                            Data
                            <input name="date" type="date" required className="h-10 rounded-md border border-line px-3" />
                          </label>
                          <label className="grid gap-1 text-sm font-medium">
                            Horas
                            <input name="hours" type="number" step="0.25" min="0.25" required className="h-10 rounded-md border border-line px-3" />
                          </label>
                        </div>
                        <label className="grid gap-1 text-sm font-medium">
                          Trabalho realizado
                          <textarea name="description" required rows={3} className="rounded-md border border-line px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm font-medium">
                          Comentario
                          <textarea name="comment" rows={2} className="rounded-md border border-line px-3 py-2" />
                        </label>
                        <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                          Salvar apontamento
                        </button>
                      </form>
                    </DialogAction>
                    <DialogAction title="Excluir tarefa" description={`Deseja realmente excluir "${task.name}"?`} trigger="delete" triggerLabel="Excluir tarefa" triggerVariant="menu">
                      <form action={deleteTaskAction} className="flex justify-end gap-2">
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="projectId" value={task.projectId} />
                        <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                          Sim, excluir
                        </button>
                      </form>
                    </DialogAction>
                    </ActionDropdown>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!tasks.length ? <div className="p-6 text-sm text-slate-500">Nenhuma tarefa cadastrada.</div> : null}
    </div>
  );
}
