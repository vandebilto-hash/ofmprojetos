"use client";

import { useState } from "react";
import { confirmMppImportAction } from "@/server/actions/projects";
import { CATEGORIES, FIELD_CATEGORY_MAP, type ImportOptions } from "./import-types";

type Change = {
  type: string;
  wbs: string | null;
  task: string;
  fields: Array<{ field: string; current: string; next: string }>;
};

type ImportOptionsDialogProps = {
  previewKey: string;
  changes: Change[];
};

function changeIsApplicable(change: Change, options: ImportOptions): boolean {
  if (change.type === "CREATE") return options.activities;
  return change.fields?.some((f) => options[FIELD_CATEGORY_MAP[f.field]]) ?? false;
}

function countChangesByCategory(changes: Change[], key: keyof ImportOptions): number {
  return changes.filter((c) => {
    if (c.type === "CREATE") return key === "activities";
    return c.fields?.some((f) => FIELD_CATEGORY_MAP[f.field] === key);
  }).length;
}

export function ImportOptionsDialog({ previewKey, changes }: ImportOptionsDialogProps) {
  const [options, setOptions] = useState<ImportOptions>({
    activities: true,
    deadlines: true,
    hours: true,
    progress: true,
    resources: true
  });

  const allChecked = Object.values(options).every(Boolean);
  const anyChecked = Object.values(options).some(Boolean);
  const totalSelected = changes.filter((c) => changeIsApplicable(c, options)).length;

  function toggleAll() {
    const next = !allChecked;
    setOptions({ activities: next, deadlines: next, hours: next, progress: next, resources: next });
  }

  function toggle(key: keyof ImportOptions) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-soft">
      <h2 className="text-lg font-bold text-amber-950">Confirmar atualizacao do cronograma</h2>
      <p className="mt-1 text-sm text-amber-900">
        Selecione o que deseja atualizar. Foram encontradas alteracoes em {changes.length} atividade(s).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={toggleAll}
          className={`flex items-center gap-2 rounded-md border p-3 text-left transition ${
            allChecked
              ? "border-amber-500 bg-amber-100"
              : "border-amber-200 bg-white hover:bg-amber-50"
          }`}
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded border ${
            allChecked ? "border-amber-600 bg-amber-600" : "border-slate-300 bg-white"
          }`}>
            {allChecked && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6l3 3 5-5" />
              </svg>
            )}
          </span>
          <span className="text-sm font-semibold text-amber-950">Tudo</span>
        </button>

        {CATEGORIES.map((cat) => {
          const count = countChangesByCategory(changes, cat.key);
          const checked = options[cat.key];
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggle(cat.key)}
              className={`flex items-center gap-2 rounded-md border p-3 text-left transition ${
                checked
                  ? "border-amber-500 bg-amber-100"
                  : "border-amber-200 bg-white hover:bg-amber-50"
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                checked ? "border-amber-600 bg-amber-600" : "border-slate-300 bg-white"
              }`}>
                {checked && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-amber-950">{cat.label}</span>
                <span className="block text-xs text-amber-700">
                  {count} {count === 1 ? "alteracao" : "alteracoes"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm font-semibold text-amber-950">
        {totalSelected} de {changes.length} alteracoes serao aplicadas
      </p>

      <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-amber-200 bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-amber-100 text-amber-950">
            <tr>
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">EDT</th>
              <th className="px-3 py-2">Atividade</th>
              <th className="px-3 py-2">Alteracoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {changes.map((change, index) => {
              const applicable = changeIsApplicable(change, options);
              return (
                <tr
                  key={`${change.wbs}-${change.task}-${index}`}
                  className={applicable ? "" : "opacity-40"}
                >
                  <td className="px-3 py-2 text-center">
                    {applicable ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-bold">
                    {change.type === "CREATE" ? "Nova" : "Atualizar"}
                  </td>
                  <td className="px-3 py-2 font-bold text-ink">{change.wbs ?? "-"}</td>
                  <td className="px-3 py-2">{change.task}</td>
                  <td className="px-3 py-2">
                    {change.fields?.length
                      ? change.fields.map((field) => {
                          const cat = FIELD_CATEGORY_MAP[field.field];
                          const enabled = options[cat];
                          return (
                            <span key={field.field} className={enabled ? "" : "line-through opacity-50"}>
                              {field.field}: {field.current || "-"} &rarr; {field.next || "-"}
                            </span>
                          );
                        }).reduce<React.ReactNode[]>((prev, curr, i) => {
                          if (i > 0) prev.push(<span key={`sep-${i}`} className="mx-1 text-slate-400">|</span>);
                          prev.push(curr);
                          return prev;
                        }, [])
                      : <span className="text-amber-700 italic">Atividade nova</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form action={confirmMppImportAction} className="mt-4 flex justify-end gap-3">
        <input type="hidden" name="previewKey" value={previewKey} />
        {CATEGORIES.map((cat) => (
          <input
            key={cat.key}
            type="hidden"
            name={cat.key}
            value={options[cat.key] ? "on" : ""}
          />
        ))}
        <button
          disabled={!anyChecked}
          className="rounded-md bg-amber-700 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50 disabled:hover:bg-amber-700"
        >
          Aplicar {anyChecked ? `(${totalSelected})` : ""}
        </button>
      </form>
    </section>
  );
}
