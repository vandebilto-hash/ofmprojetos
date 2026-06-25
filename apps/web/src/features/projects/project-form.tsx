import { createProjectAction } from "@/server/actions/projects";

const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const selectClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";
const textareaClass = "min-h-[80px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300";
const required = <span className="text-red-500" aria-hidden="true">*</span>;

export function ProjectForm({
  clients,
  managers
}: {
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  return (
    <form action={createProjectAction} className="grid max-w-4xl gap-5 rounded-lg border border-line bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-[#111c31]">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dados gerais</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Nome do projeto {required}
            <input name="name" required className={inputClass} placeholder="Nome do projeto" />
          </label>
          <label className={labelClass}>
            Cliente {required}
            <select name="clientId" required className={selectClass}>
              <option value="">Selecione o cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={`${labelClass} mt-4`}>
          Descrição
          <textarea name="description" rows={3} className={textareaClass} placeholder="Descreva o escopo e objetivos do projeto" />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cronograma</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <label className={labelClass}>
            Gestor {required}
            <select name="managerId" required className={selectClass}>
              <option value="">Selecione o gestor</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Início planejado {required}
            <input name="plannedStart" type="date" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Fim planejado {required}
            <input name="plannedEnd" type="date" required className={inputClass} />
          </label>
        </div>
        <label className={`${labelClass} mt-4`}>
          Fim atualizado {required}
          <input name="currentEnd" type="date" required className={inputClass} />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observações</h3>
        <label className={`${labelClass} mt-3`}>
          <textarea name="notes" rows={3} className={textareaClass} placeholder="Notas internas, restrições ou observações relevantes" />
        </label>
      </div>

      <div className="flex justify-end border-t border-line pt-4 dark:border-slate-700">
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
          Criar projeto
        </button>
      </div>
    </form>
  );
}
