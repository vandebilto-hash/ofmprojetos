"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importMppProjectAction } from "@/server/actions/projects";

type ImportProjectFormProps = {
  projects: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
  managers: Array<{ id: string; name: string }>;
  defaultManagerId?: string;
};

export function ImportProjectForm({ projects, clients, managers, defaultManagerId }: ImportProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await importMppProjectAction(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.redirect) {
          window.location.assign(result.redirect);
        } else {
          formRef.current?.reset();
          window.dispatchEvent(new CustomEvent("projete:toast", { detail: { message: "Projeto importado com sucesso." } }));
          router.refresh();
        }
      } catch (err: any) {
        setError(err?.message || "Erro ao importar projeto.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Arquivo MPP, XML, MPX ou CSV
        <input name="file" type="file" accept=".mpp,.xml,.mpx,.csv,text/csv" required className="rounded-md border border-line px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Nome do projeto
        <input name="projectName" placeholder="Opcional. Se vazio, usa o nome do arquivo." className="h-10 rounded-md border border-line px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Projeto existente para atualizar
        <select name="existingProjectId" className="h-10 rounded-md border border-line px-3">
          <option value="">Criar novo projeto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Cliente
          <select name="clientId" required className="h-10 rounded-md border border-line px-3">
            <option value="">Selecione o cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Gestor
          <select name="managerId" required defaultValue={defaultManagerId ?? ""} className="h-10 rounded-md border border-line px-3">
            <option value="">Selecione o gestor</option>
            {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">
        No CSV, use colunas como EDT/WBS, Tarefa, Inicio, Fim, Horas, Avanco, Responsavel e Predecessoras. Recursos serao vinculados automaticamente quando o nome corresponder a um usuario ativo do Projete-se.
      </p>
      <a href="/api/templates/import-project" target="_blank" rel="noopener noreferrer" className="w-fit text-xs font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800">
        Baixar template (abre no MS Project)
      </a>
      <button disabled={isPending} className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {isPending ? "Importando..." : "Importar projeto"}
      </button>
    </form>
  );
}
