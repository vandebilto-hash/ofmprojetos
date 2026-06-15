"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";

type Project = { id: string; name: string };
type User = { id: string; name: string };

const taskStatuses = [
  ["", "Todos os status"],
  ["TODO", "A fazer"],
  ["IN_PROGRESS", "Em andamento"],
  ["IN_REVIEW", "Em validacao"],
  ["BLOCKED", "Bloqueado"],
  ["DONE", "Concluido"]
];

export function TaskFilters({
  projects,
  users,
  defaultValues
}: {
  projects: Project[];
  users: User[];
  defaultValues: {
    projectId?: string;
    status?: string;
    ownerId?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      return `/tasks?${params.toString()}`;
    },
    [searchParams]
  );

  const updateParam = useCallback(
    (key: string, value: string) => {
      const url = buildUrl(key, value);
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [router, buildUrl]
  );

  const updateParamDebounced = useCallback(
    (key: string, value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParam(key, value);
      }, 300);
    },
    [updateParam]
  );

  return (
    <form className="relative mb-5 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
          <span className="text-sm font-medium text-slate-500">Carregando...</span>
        </div>
      )}
      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        Projeto
        <select
          name="projectId"
          defaultValue={defaultValues.projectId ?? ""}
          onChange={(e) => updateParam("projectId", e.target.value)}
          className="h-10 rounded-md border border-line px-3 text-sm font-normal text-ink"
        >
          <option value="">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        Status
        <select
          name="status"
          defaultValue={defaultValues.status ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-10 rounded-md border border-line px-3 text-sm font-normal text-ink"
        >
          {taskStatuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        Responsavel
        <select
          name="ownerId"
          defaultValue={defaultValues.ownerId ?? ""}
          onChange={(e) => updateParam("ownerId", e.target.value)}
          className="h-10 rounded-md border border-line px-3 text-sm font-normal text-ink"
        >
          <option value="">Todos os responsaveis</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        Prazo de
        <input
          name="startDate"
          type="date"
          defaultValue={defaultValues.startDate ?? ""}
          onChange={(e) => updateParamDebounced("startDate", e.target.value)}
          className="h-10 rounded-md border border-line px-3 text-sm font-normal text-ink"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-500">
        Prazo ate
        <input
          name="endDate"
          type="date"
          defaultValue={defaultValues.endDate ?? ""}
          onChange={(e) => updateParamDebounced("endDate", e.target.value)}
          className="h-10 rounded-md border border-line px-3 text-sm font-normal text-ink"
        />
      </label>
      <div className="md:col-span-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isPending ? "" : `${searchParams.toString() ? "Filtros aplicados" : "Todos os resultados"}`}
        </p>
        {searchParams.toString() ? (
          <a href="/tasks" className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-slate-600">
            Limpar filtros
          </a>
        ) : null}
      </div>
    </form>
  );
}
