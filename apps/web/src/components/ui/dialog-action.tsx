"use client";

import { useId, useRef } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type DialogActionProps = {
  title: string;
  description?: string;
  trigger: "create" | "edit" | "delete";
  triggerLabel?: string;
  triggerVariant?: "default" | "menu";
  children: React.ReactNode;
};

export function DialogAction({ title, description, trigger, triggerLabel, triggerVariant = "default", children }: DialogActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isCreate = trigger === "create";
  const isEdit = trigger === "edit";
  const icon = isCreate ? <Plus size={16} /> : isEdit ? <Pencil size={16} /> : <Trash2 size={16} />;
  const label = triggerLabel ?? (isCreate ? "Criar" : isEdit ? "Editar" : "Excluir");

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          triggerVariant === "menu"
            ? trigger === "delete"
              ? "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-500/15"
              : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-100 dark:hover:bg-slate-800"
            : isCreate
            ? "inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            : isEdit
            ? "inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700"
            : "inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200/80 bg-red-50/80 text-red-700 hover:bg-red-100 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
        }
        title={label}
      >
        {triggerVariant === "menu" ? (
          <>
            {icon}
            {label}
          </>
        ) : isCreate ? (
          <>
            <Plus size={16} />
            {triggerLabel ?? "Criar"}
          </>
        ) : isEdit ? (
          <Pencil size={16} />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-full max-w-2xl rounded-lg border border-line p-0 shadow-soft backdrop:bg-ink/40"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
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
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}
