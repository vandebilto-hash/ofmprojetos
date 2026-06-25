"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

type PeopleSelectProps = {
  name: string;
  label: string;
  people: string[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
};

const inputClass = "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder-slate-500";

export function PeopleSelect({ name, label, people, defaultValue, placeholder = "Pesquisar pessoa...", required }: PeopleSelectProps) {
  const options = useMemo(() => Array.from(new Set(people.map((p) => p.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [people]);
  const [value, setValue] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (p) => p.toLowerCase().includes(query.toLowerCase()) && p !== value
  ).slice(0, 8);

  useEffect(() => {
    const form = inputRef.current?.closest("form");
    if (!form) return;
    function handleReset() { setValue(defaultValue ?? ""); setQuery(defaultValue ?? ""); }
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectPerson(person: string) {
    setValue(person);
    setQuery(person);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
      <input type="hidden" name={name} value={value} />
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setValue(""); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Backspace" && !query) setValue("");
            }}
            placeholder={placeholder}
            className={`${inputClass} pr-8`}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {value && (
              <button type="button" onClick={() => { setValue(""); setQuery(""); inputRef.current?.focus(); }} className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={14} />
              </button>
            )}
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>
        {open && (filtered.length > 0 || (query && !options.includes(query))) && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg dark:border-slate-700 dark:bg-[#111c31]">
            {filtered.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => selectPerson(person)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-slate-800 ${person === value ? "bg-brand-50 font-semibold text-brand-700 dark:bg-slate-800 dark:text-brand-300" : "text-ink dark:text-white"}`}
              >
                <Search size={14} className="shrink-0 text-slate-400" />
                {person}
              </button>
            ))}
            {query && !options.includes(query) && (
              <button
                type="button"
                onClick={() => selectPerson(query)}
                className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-800"
              >
                + Usar &quot;{query}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
