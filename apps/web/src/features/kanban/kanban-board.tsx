"use client";

import { useMemo, useState, useTransition } from "react";
import { DialogAction } from "@/components/ui/dialog-action";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { updateTaskAction, updateTaskStatusAction } from "@/server/actions/projects";

const columns = [
  ["TODO", "A fazer"],
  ["IN_PROGRESS", "Em andamento"],
  ["IN_REVIEW", "Em validacao"],
  ["BLOCKED", "Bloqueado"],
  ["DONE", "Concluido"]
] as const;

type Status = (typeof columns)[number][0];

type Task = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  status: string;
  priority: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  estimatedHours: unknown;
  actualHours: unknown;
  progressPercent: unknown;
  owner?: { name: string } | null;
};

type UserOption = { id: string; name: string };

function inputDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function KanbanBoard({ tasks, users }: { tasks: Task[]; users: UserOption[] }) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();
  const now = useMemo(() => new Date(), []);

  function onDrop(status: Status) {
    return (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData("text/task-id");
      if (!taskId) return;

      setLocalTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
      startTransition(() => updateTaskStatusAction(taskId, status));
    };
  }

  return (
    <div>
      {isPending ? <p className="mb-3 text-sm text-brand-700">Atualizando Kanban...</p> : null}
      <div className="grid min-w-[1180px] grid-cols-5 gap-3 overflow-x-auto">
        {columns.map(([status, label]) => (
          <div
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop(status)}
            className="min-h-[520px] rounded-lg border border-line bg-slate-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">{label}</h2>
              <span className="text-xs text-slate-500">
                {localTasks.filter((task) => task.status === status).length}
              </span>
            </div>
            <div className="grid gap-3">
              {localTasks
                .filter((task) => task.status === status)
                .map((task) => {
                  const delayed = new Date(task.plannedEnd) < now && task.status !== "DONE";
                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                      className={`rounded-lg border border-line bg-white p-3 shadow-sm ${delayed ? "border-red-200 bg-red-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold">{task.name}</h3>
                        <StatusBadge status={task.priority} />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">Resp.: {task.owner?.name ?? "-"}</p>
                      <p className="mt-1 text-xs text-slate-500">Prazo: {formatDate(task.plannedEnd)}</p>
                      <div className="mt-3">
                        <DialogAction title="Editar tarefa" description={task.name} trigger="edit">
                          <form action={updateTaskAction} className="grid gap-2">
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="projectId" value={task.projectId} />
                          <input name="name" defaultValue={task.name} className="h-9 rounded-md border border-line px-2 text-sm" />
                          <textarea name="description" defaultValue={task.description ?? ""} rows={2} className="rounded-md border border-line px-2 py-1 text-sm" />
                          <select name="ownerId" defaultValue={task.ownerId ?? ""} className="h-9 rounded-md border border-line px-2 text-sm">
                            <option value="">Sem responsavel</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select name="status" defaultValue={task.status} className="h-9 rounded-md border border-line px-2 text-sm">
                              {columns.map(([value, itemLabel]) => (
                                <option key={value} value={value}>
                                  {itemLabel}
                                </option>
                              ))}
                            </select>
                            <select name="priority" defaultValue={task.priority} className="h-9 rounded-md border border-line px-2 text-sm">
                              <option value="LOW">Baixa</option>
                              <option value="MEDIUM">Media</option>
                              <option value="HIGH">Alta</option>
                              <option value="CRITICAL">Critica</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input name="plannedStart" type="date" defaultValue={inputDate(task.plannedStart)} className="h-9 rounded-md border border-line px-2 text-sm" />
                            <input name="plannedEnd" type="date" defaultValue={inputDate(task.plannedEnd)} className="h-9 rounded-md border border-line px-2 text-sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input name="estimatedHours" type="number" step="0.5" defaultValue={Number(task.estimatedHours)} className="h-9 rounded-md border border-line px-2 text-sm" />
                            <input name="actualHours" type="number" step="0.5" defaultValue={Number(task.actualHours)} className="h-9 rounded-md border border-line px-2 text-sm" />
                            <input name="progressPercent" type="number" min="0" max="100" defaultValue={Number(task.progressPercent)} className="h-9 rounded-md border border-line px-2 text-sm" />
                          </div>
                          <button className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
                            Salvar
                          </button>
                        </form>
                        </DialogAction>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
