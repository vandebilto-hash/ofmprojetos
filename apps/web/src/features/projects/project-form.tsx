import { createProjectAction } from "@/server/actions/projects";

export function ProjectForm({
  clients,
  managers
}: {
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  return (
    <form action={createProjectAction} className="grid max-w-4xl gap-4 rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1 text-sm font-medium">
          Nome do projeto
          <input name="name" required className="h-10 rounded-md border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Cliente
          <select name="clientId" required className="h-10 rounded-md border border-line px-3">
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Descricao
        <textarea name="description" rows={3} className="rounded-md border border-line px-3 py-2" />
      </label>
      <div className="grid grid-cols-3 gap-4">
        <label className="grid gap-1 text-sm font-medium">
          Gestor
          <select name="managerId" required className="h-10 rounded-md border border-line px-3">
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Inicio planejado
          <input name="plannedStart" type="date" required className="h-10 rounded-md border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Fim planejado
          <input name="plannedEnd" type="date" required className="h-10 rounded-md border border-line px-3" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Fim atualizado
        <input name="currentEnd" type="date" required className="h-10 rounded-md border border-line px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Observacoes
        <textarea name="notes" rows={3} className="rounded-md border border-line px-3 py-2" />
      </label>
      <button className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Criar projeto
      </button>
    </form>
  );
}
