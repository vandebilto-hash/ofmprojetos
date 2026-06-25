"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, ChevronDown } from "lucide-react";

type PeopleMultiSelectProps = {
  name: string;
  label: string;
  people: string[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
};

function parsePeople(value?: string | null) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

const inputClass = "h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";

export function PeopleMultiSelect({ name, label, people, defaultValue, placeholder = "Digite e selecione", required }: PeopleMultiSelectProps) {
  const initialValue = useMemo(() => parsePeople(defaultValue), [defaultValue]);
  const options = useMemo(() => Array.from(new Set(people.map((p) => p.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [people]);
  const [selected, setSelected] = useState(initialValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (p) => !selected.includes(p) && p.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const form = inputRef.current?.closest("form");
    if (!form) return;
    function handleReset() { setSelected(initialValue); setQuery(""); }
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [initialValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addPerson(value: string) {
    const person = value.trim();
    if (!person || selected.includes(person)) return;
    setSelected((c) => [...c, person]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removePerson(person: string) {
    setSelected((c) => c.filter((p) => p !== person));
  }

  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
      <input type="hidden" name={name} value={selected.join(", ")} />
      {required ? <input className="sr-only" tabIndex={-1} required value={selected.join(", ")} onChange={() => undefined} /> : null}
      <div ref={wrapperRef} className="relative mt-1.5">
        {selected.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {selected.map((person) => (
              <span key={person} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {person}
                <button type="button" onClick={() => removePerson(person)} className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/30" aria-label={`Remover ${person}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addPerson(query); }
              if (e.key === "Backspace" && !query && selected.length) setSelected((c) => c.slice(0, -1));
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={selected.length ? "Adicionar outra pessoa" : placeholder}
            className={`${inputClass} pr-8`}
          />
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg dark:border-slate-700 dark:bg-[#111c31]">
            {filtered.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => { addPerson(person); setQuery(""); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-brand-50 dark:text-white dark:hover:bg-slate-800"
              >
                <Search size={14} className="shrink-0 text-slate-400" />
                {person}
              </button>
            ))}
            {query && !filtered.includes(query) && (
              <button
                type="button"
                onClick={() => { addPerson(query); setQuery(""); }}
                className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-800"
              >
                + Adicionar &quot;{query}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
