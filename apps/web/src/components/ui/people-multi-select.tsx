"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

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

export function PeopleMultiSelect({ name, label, people, defaultValue, placeholder = "Digite ou selecione pessoas", required }: PeopleMultiSelectProps) {
  const initialValue = useMemo(() => parsePeople(defaultValue), [defaultValue]);
  const options = useMemo(() => Array.from(new Set(people.map((person) => person.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [people]);
  const [selected, setSelected] = useState(initialValue);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((person) => !selected.includes(person) && person.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  useEffect(() => {
    const form = inputRef.current?.closest("form");
    if (!form) return;

    function handleReset() {
      setSelected(initialValue);
      setQuery("");
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [initialValue]);

  function addPerson(value: string) {
    const person = value.trim();
    if (!person || selected.includes(person)) return;
    setSelected((current) => [...current, person]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removePerson(person: string) {
    setSelected((current) => current.filter((item) => item !== person));
  }

  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input type="hidden" name={name} value={selected.join(", ")} />
      {required ? <input className="sr-only" tabIndex={-1} required value={selected.join(", ")} onChange={() => undefined} /> : null}
      <div className="rounded-md border border-line bg-white px-2 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
        <div className="flex min-h-6 flex-wrap gap-1.5">
          {selected.map((person) => (
            <span key={person} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
              {person}
              <button type="button" onClick={() => removePerson(person)} className="rounded-full p-0.5 hover:bg-brand-100" aria-label={`Remover ${person}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addPerson(query);
            }
            if (event.key === "Backspace" && !query && selected.length) {
              setSelected((current) => current.slice(0, -1));
            }
          }}
          placeholder={selected.length ? "Adicionar outra pessoa" : placeholder}
          className="mt-1 h-8 w-full border-0 bg-transparent px-1 text-sm outline-none"
        />
      </div>
      {filteredOptions.length ? (
        <div className="flex flex-wrap gap-1">
          {filteredOptions.map((person) => (
            <button key={person} type="button" onClick={() => addPerson(person)} className="rounded-full border border-line bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700">
              {person}
            </button>
          ))}
        </div>
      ) : null}
      <span className="text-xs font-normal text-slate-500">Selecione uma ou mais pessoas, ou digite um novo nome e pressione Enter.</span>
    </label>
  );
}
