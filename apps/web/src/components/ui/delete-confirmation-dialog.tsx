"use client";

import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type DeleteActionState = {
  status: "idle" | "success" | "blocked" | "error";
  message: string;
  causes: string[];
};

type DeleteConfirmationDialogProps = {
  title: string;
  description: string;
  entityIdName: string;
  entityId: string;
  confirmLabel: string;
  action: (state: DeleteActionState, formData: FormData) => Promise<DeleteActionState>;
};

const initialState: DeleteActionState = {
  status: "idle",
  message: "",
  causes: []
};

export function DeleteConfirmationDialog({
  title,
  description,
  entityIdName,
  entityId,
  confirmLabel,
  action
}: DeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      window.dispatchEvent(new CustomEvent("projete:toast", { detail: { message: state.message } }));
      window.setTimeout(() => dialogRef.current?.close(), 250);
      window.setTimeout(() => router.refresh(), 500);
    }

    if (state.status === "blocked" || state.status === "error") {
      window.dispatchEvent(new CustomEvent("projete:toast", { detail: { message: state.message } }));
      router.refresh();
    }
  }, [router, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200/80 bg-red-50/80 text-red-700 hover:bg-red-100 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
        title={confirmLabel}
      >
        <Trash2 size={16} />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-full max-w-xl rounded-lg border border-line p-0 shadow-soft backdrop:bg-ink/40"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate-600 hover:bg-slate-50"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        <form action={formAction} className="grid gap-4 p-5">
          <input type="hidden" name={entityIdName} value={entityId} />
          <p className="text-sm text-slate-600">
            Antes de excluir, o sistema valida se este registro ainda e necessario para manter o historico de projetos, auditoria e operacao.
          </p>

          {state.status === "blocked" || state.status === "error" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-bold">{state.message}</p>
              {state.causes.length ? (
                <>
                  <p className="mt-3 font-semibold">Causas raizes:</p>
                  <ul className="mt-2 grid gap-1">
                    {state.causes.map((cause) => (
                      <li key={cause} className="flex gap-2">
                        <span aria-hidden="true">-</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <SubmitButton label={confirmLabel} />
          </div>
        </form>
      </dialog>
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Validando..." : label}
    </button>
  );
}
