import { formatDate } from "@/lib/format";
import { DialogAction } from "@/components/ui/dialog-action";
import { deleteAllocationAction, upsertAllocationAction } from "@/server/actions/projects";

type Allocation = {
  id: string;
  userId: string;
  taskId: string | null;
  startDate: Date;
  endDate: Date;
  allocatedHours: unknown;
  user: { name: string };
  task?: { name: string } | null;
};

type UserOption = { id: string; name: string };
type TaskOption = { id: string; name: string };

function inputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function ResourceAllocationEditor({
  projectId,
  allocations,
  users,
  tasks
}: {
  projectId: string;
  allocations: Allocation[];
  users: UserOption[];
  tasks: TaskOption[];
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Alocacoes de recursos</h2>
        <DialogAction title="Adicionar recurso" description="Cadastre uma nova alocacao para este projeto." trigger="create" triggerLabel="Novo recurso">
          <form action={upsertAllocationAction} className="grid gap-3">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="grid gap-1 text-sm font-medium">
              Recurso
              <select name="userId" className="h-10 rounded-md border border-line px-3">
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Tarefa
              <select name="taskId" required className="h-10 rounded-md border border-line px-3">
                <option value="">Selecione a tarefa</option>
                {tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input name="startDate" type="date" required className="h-10 rounded-md border border-line px-3" />
              <input name="endDate" type="date" required className="h-10 rounded-md border border-line px-3" />
              <input name="allocatedHours" type="number" step="0.5" min="0" required placeholder="Horas" className="h-10 rounded-md border border-line px-3" />
            </div>
            <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Adicionar recurso</button>
          </form>
        </DialogAction>
      </div>

      <div className="mt-4 grid gap-2">
        {allocations.map((allocation) => (
          <div key={allocation.id} className="flex items-center justify-between rounded-md border border-line p-3 text-sm">
            <div>
              <p className="font-semibold">{allocation.user.name}</p>
              <p className="text-slate-500">
                {allocation.task?.name ?? "Tarefa nao vinculada"} | {formatDate(allocation.startDate)} - {formatDate(allocation.endDate)} | {Number(allocation.allocatedHours)}h
              </p>
            </div>
            <div className="flex gap-2">
              <DialogAction title="Editar alocacao" description={allocation.user.name} trigger="edit">
                <form action={upsertAllocationAction} className="grid gap-3">
                  <input type="hidden" name="allocationId" value={allocation.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <select name="userId" defaultValue={allocation.userId} className="h-10 rounded-md border border-line px-3">
                    {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                  <select name="taskId" required defaultValue={allocation.taskId ?? ""} className="h-10 rounded-md border border-line px-3">
                    <option value="">Selecione a tarefa</option>
                    {tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-3">
                    <input name="startDate" type="date" defaultValue={inputDate(allocation.startDate)} className="h-10 rounded-md border border-line px-3" />
                    <input name="endDate" type="date" defaultValue={inputDate(allocation.endDate)} className="h-10 rounded-md border border-line px-3" />
                    <input name="allocatedHours" type="number" step="0.5" defaultValue={Number(allocation.allocatedHours)} className="h-10 rounded-md border border-line px-3" />
                  </div>
                  <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Salvar alocacao</button>
                </form>
              </DialogAction>
              <DialogAction title="Excluir recurso" description={`Deseja realmente remover ${allocation.user.name} deste projeto?`} trigger="delete">
                <form action={deleteAllocationAction} className="flex justify-end">
                  <input type="hidden" name="allocationId" value={allocation.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Sim, excluir</button>
                </form>
              </DialogAction>
            </div>
          </div>
        ))}
        {!allocations.length ? <p className="text-sm text-slate-500">Nenhuma alocacao cadastrada.</p> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        A matriz abaixo continua destacando em vermelho quem ultrapassar a capacidade semanal.
      </p>
    </div>
  );
}
