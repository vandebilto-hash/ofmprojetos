import { createTaskAction } from "@/server/actions/projects";

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
    <form action={createTaskAction} className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-soft">
      {projectId ? (
        <input type="hidden" name="projectId" value={projectId} />
      ) : (
        <label className="grid gap-1 text-sm font-medium">
          Projeto
          <select name="projectId" required className="h-10 rounded-md border border-line px-3">
            <option value="">Selecione o projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Tarefa
          <input name="name" required className="h-10 rounded-md border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Responsavel
          <select name="ownerId" className="h-10 rounded-md border border-line px-3">
            <option value="">Sem responsavel</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea name="description" rows={2} placeholder="Descricao" className="rounded-md border border-line px-3 py-2" />
      <label className="grid gap-1 text-sm font-medium">
        Predecessoras
        <select
          name="predecessorIds"
          multiple
          className="min-h-24 rounded-md border border-line px-3 py-2 text-sm"
        >
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-slate-500">
          Segure Ctrl para selecionar mais de uma tarefa. A nova tarefa sera reagendada quando suas predecessoras mudarem.
        </span>
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select name="status" defaultValue="TODO" className="h-10 min-w-0 rounded-md border border-line px-3">
            <option value="TODO">A fazer</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="IN_REVIEW">Em validacao</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="DONE">Concluido</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Prioridade
          <select name="priority" defaultValue="MEDIUM" className="h-10 min-w-0 rounded-md border border-line px-3">
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Critica</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Horas
          <input name="estimatedHours" type="number" step="0.5" min="0" placeholder="Horas" className="h-10 min-w-0 rounded-md border border-line px-3" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Inicio
          <input name="plannedStart" type="date" required className="h-10 min-w-0 rounded-md border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Fim
          <input name="plannedEnd" type="date" required className="h-10 min-w-0 rounded-md border border-line px-3" />
        </label>
      </div>
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Adicionar tarefa
      </button>
    </form>
  );
}
