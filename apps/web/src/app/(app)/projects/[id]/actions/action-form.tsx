"use client";

import { useState } from "react";
import { PeopleSelect } from "@/components/ui/people-select";
import { upsertProjectActionAction } from "@/server/actions/projects";

function inputDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function ActionForm({ project, people, action }: { project: any; people: string[]; action?: any }) {
  const isEdit = Boolean(action);
  const inputClass = "h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const selectClass = "h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
  const textareaClass = "min-h-[80px] rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
  const sectionTitle = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const [hasLinks, setHasLinks] = useState(Boolean(action?.riskId || action?.pendingIssueId || action?.blockerId || action?.taskId));

  return (
    <form action={upsertProjectActionAction} className="grid gap-4">
      {isEdit ? <input type="hidden" name="actionId" value={action.id} /> : null}
      <input type="hidden" name="projectId" value={project.id} />

      <div>
        <p className={sectionTitle}>Identificação</p>
        <div className="mt-2 grid gap-3">
          <label className={labelClass}>
            Nome da ação <span className="text-red-500">*</span>
            <input name="description" required defaultValue={action?.description ?? ""} className={inputClass} placeholder="Nome da ação" />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Responsável e prazo</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <PeopleSelect name="responsible" label="Responsável" people={people} defaultValue={action?.responsible ?? ""} required />
          <label className={labelClass}>
            Prazo <span className="text-red-500">*</span>
            <input name="dueDate" type="date" defaultValue={inputDate(action?.dueDate)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            Origem <span className="text-red-500">*</span>
            <select name="origin" defaultValue={action?.origin ?? "Manual"} className={selectClass} required>
              <option value="Manual">Manual</option>
              <option value="Risco">Risco</option>
              <option value="Pendência">Pendência</option>
              <option value="Bloqueio">Bloqueio</option>
              <option value="Tarefa">Tarefa</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Status e classificação</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            Status <span className="text-red-500">*</span>
            <select name="status" defaultValue={action?.status ?? "OPEN"} className={selectClass} required>
              <option value="OPEN">Aberta</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </label>
          <label className={labelClass}>
            Prioridade <span className="text-red-500">*</span>
            <select name="priority" defaultValue={action?.priority ?? "MEDIUM"} className={selectClass} required>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </label>
          <label className={labelClass}>
            Semáforo <span className="text-red-500">*</span>
            <select name="trafficLight" defaultValue={action?.trafficLight ?? "GREEN"} className={selectClass} required>
              <option value="GREEN">Verde</option>
              <option value="YELLOW">Amarelo</option>
              <option value="RED">Vermelho</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input name="visibleToClient" type="checkbox" defaultChecked={action?.visibleToClient ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Visível ao cliente
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Vínculos</p>
        <div className="mt-2">
          <label className="mb-3 flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasLinks}
              onChange={(e) => setHasLinks(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Possui risco, tarefa, pendência ou bloqueio relacionado?
          </label>
          {hasLinks && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Risco relacionado
                <select name="riskId" defaultValue={action?.riskId ?? ""} className={selectClass}>
                  <option value="">Sem risco</option>
                  {project.risks.map((risk: any) => <option key={risk.id} value={risk.id}>{risk.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Pendência relacionada
                <select name="pendingIssueId" defaultValue={action?.pendingIssueId ?? ""} className={selectClass}>
                  <option value="">Sem pendência</option>
                  {project.pendingIssues.map((pending: any) => <option key={pending.id} value={pending.id}>{pending.title}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Bloqueio relacionado
                <select name="blockerId" defaultValue={action?.blockerId ?? ""} className={selectClass}>
                  <option value="">Sem bloqueio</option>
                  {project.blockers.map((blocker: any) => <option key={blocker.id} value={blocker.id}>{blocker.title}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Tarefa relacionada
                <select name="taskId" defaultValue={action?.taskId ?? ""} className={selectClass}>
                  <option value="">Sem tarefa</option>
                  {project.tasks.map((task: any) => <option key={task.id} value={task.id}>{task.wbsCode ? `${task.wbsCode} - ` : ""}{task.name}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Progresso e horas</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            Progresso planejado (%) <span className="text-red-500">*</span>
            <input name="plannedProgress" type="number" min="0" max="100" defaultValue={Number(action?.plannedProgress ?? 0)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            Progresso realizado (%) <span className="text-red-500">*</span>
            <input name="actualProgress" type="number" min="0" max="100" defaultValue={Number(action?.actualProgress ?? 0)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            Horas estimadas <span className="text-red-500">*</span>
            <input name="estimatedHours" type="number" min="0" step="0.5" defaultValue={Number(action?.estimatedHours ?? 0)} className={inputClass} required />
          </label>
          <label className={labelClass}>
            Horas realizadas <span className="text-red-500">*</span>
            <input name="workedHours" type="number" min="0" step="0.5" defaultValue={Number(action?.workedHours ?? 0)} className={inputClass} required />
          </label>
        </div>
      </div>

      <div>
        <p className={sectionTitle}>Próxima ação</p>
        <label className={`${labelClass} mt-2`}>
          <textarea name="nextAction" rows={2} defaultValue={action?.nextAction ?? ""} className={textareaClass} placeholder="Próxima ação a ser tomada" required />
        </label>
      </div>

      <div className="flex justify-end border-t border-line pt-3 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          {isEdit ? "Salvar ação" : "Cadastrar ação"}
        </button>
      </div>
    </form>
  );
}
