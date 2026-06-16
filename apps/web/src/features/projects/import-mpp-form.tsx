"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importMppProjectAction } from "@/server/actions/projects";

type ImportMppFormProps = {
  projectId: string;
  clientId: string;
  managerId: string;
};

export function ImportMppForm({ projectId, clientId, managerId }: ImportMppFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await importMppProjectAction(formData);
        formRef.current?.reset();
        window.dispatchEvent(new CustomEvent("projete:toast", { detail: { message: "Cronograma importado com sucesso." } }));
        router.refresh();
      } catch (err: any) {
        if (err?.message?.includes("NEXT_REDIRECT")) throw err;
        setError(err?.message || "Erro ao importar cronograma.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <input type="hidden" name="existingProjectId" value={projectId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="managerId" value={managerId} />
      <label className="grid gap-1 text-sm font-medium">
        Arquivo MPP/XML/MPX/CSV
        <input name="file" type="file" required accept=".mpp,.xml,.mpx,.csv" className="rounded-md border border-line px-3 py-2" />
      </label>
      <button disabled={isPending} className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {isPending ? "Importando..." : "Importar cronograma"}
      </button>
    </form>
  );
}
