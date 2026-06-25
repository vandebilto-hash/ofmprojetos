import { createTaskAction } from "@/server/actions/projects";

const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const required = <span className="text-red-500" aria-hidden="true">*</span>;

export function TaskForm({
  projectId,
  users,
  tasks = [],
  projects = []
}: {
  projectId?: string;
  users: { id: string; name: string }[];
  tasks?: { id: string; name: string }[];
  projects?: { id: string; name: string }[];
}) {
  return (
    <form action={createTaskAction} className="grid gap-5 rounded-lg border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
      {!projectId && (
        <label className={labelClass}>
          Projeto {required}
          <select name="projectId" required className={selectClass}>
            <option value="">Selecione o projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
      )}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Identificação</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Tarefa {required}
            <input name="name" required className={inputClass} placeholder="Nome da tarefa" />
          </label>
          <label className={labelClass}>
            Responsável {required}
            <select name="ownerId" required className={selectClass}>
              <option value="">Selecione o responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={`${labelClass} mt-4`}>
          Descrição
          <textarea name="description" rows={2} className={textareaClass} placeholder="Descrição detalhada da tarefa" />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Predecessoras</h3>
        <label className={`${labelClass} mt-3`}>
          <select name="predecessorIds" multiple className="min-h-24 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none dark:border-slate-700 dark:bg-[#0f172a] dark:text-white">
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
          </select>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Segure Ctrl para selecionar mais de uma tarefa. A nova tarefa será reagendada quando suas predecessoras mudarem.
          </span>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Classificação</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <label className={labelClass}>
            Ocorrência {required}
            <input name="occurNumber" required placeholder="Ex: 142637" className={inputClass} />
          </label>
          <label className={labelClass}>
            Tipo ocorrência {required}
            <input name="occurType" required placeholder="Ex: IMPLANTAÇÃO" className={inputClass} />
          </label>
          <label className={labelClass}>
            Situação ocorrência {required}
            <input name="occurSituation" required placeholder="Ex: PENDENTE" className={inputClass} />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Status {required}
            <select name="status" defaultValue="TODO" required className={selectClass}>
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="IN_REVIEW">Em validação</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="DONE">Concluído</option>
            </select>
          </label>
          <label className={labelClass}>
            Prioridade {required}
            <select name="priority" defaultValue="MEDIUM" required className={selectClass}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cronograma e esforço</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <label className={labelClass}>
            Horas estimadas {required}
            <input name="estimatedHours" type="number" step="0.5" min="0" required placeholder="Horas" className={inputClass} />
          </label>
          <label className={labelClass}>
            Início {required}
            <input name="plannedStart" type="date" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Fim {required}
            <input name="plannedEnd" type="date" required className={inputClass} />
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-4 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
          Adicionar tarefa
        </button>
      </div>
    </form>
  );
}
